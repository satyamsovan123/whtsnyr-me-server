import { conflict, notFound, badRequest } from "../../common/errors/app-error.js";
import { toSlug } from "../../common/utils/slug.js";
import { Area } from "./area.model.js";
import { Event } from "./event.model.js";
import { geocodeLocation } from "./geocoder.service.js";
import { Merchant } from "./merchant.model.js";
import { Place } from "./place.model.js";

const catalogModels = Object.freeze({
  areas: Area,
  places: Place,
  events: Event,
  merchants: Merchant,
});

const allowedFields = Object.freeze({
  areas: [
    "name",
    "slug",
    "city",
    "state",
    "country",
    "postalCodes",
    "timezone",
    "center",
    "description",
    "sourceRefs",
    "sourceKey",
    "lastVerifiedAt",
  ],
  places: [
    "areaId",
    "name",
    "slug",
    "summary",
    "types",
    "location",
    "address",
    "visitDurationMinutes",
    "priceBand",
    "entryFeeMinor",
    "tags",
    "accessibility",
    "familyFriendly",
    "indoor",
    "openingHours",
    "mediaUrls",
    "sourceRefs",
    "sourceKey",
    "lastVerifiedAt",
  ],
  events: [
    "areaId",
    "placeId",
    "name",
    "slug",
    "summary",
    "location",
    "startsAt",
    "endsAt",
    "timezone",
    "tags",
    "priceBand",
    "priceMinor",
    "bookingUrl",
    "seriesKey",
    "sourceRefs",
    "sourceKey",
    "lastVerifiedAt",
  ],
  merchants: [
    "areaId",
    "name",
    "slug",
    "summary",
    "location",
    "categories",
    "craftProvenance",
    "priceBand",
    "fulfillmentModes",
    "contact",
    "verificationStatus",
    "sourceRefs",
    "sourceKey",
    "lastVerifiedAt",
  ],
});

function geoJson(value) {
  return { type: "Point", coordinates: [value.longitude, value.latitude] };
}

function toPersistence(resource, input) {
  const output = {};
  for (const field of allowedFields[resource]) {
    if (input[field] !== undefined) output[field] = input[field];
  }
  if (output.location) output.location = geoJson(output.location);
  if (output.center) output.center = geoJson(output.center);
  if (!output.slug && output.name) output.slug = toSlug(output.name);
  return output;
}

function publicFilter(resource, query) {
  const filter = { status: "PUBLISHED", archivedAt: null };
  if (resource === "merchants") filter.verificationStatus = "VERIFIED";
  if (query.areaId && resource !== "areas") filter.areaId = query.areaId;
  if (query.cursor && query.latitude === undefined) filter._id = { $lt: query.cursor };
  if (query.type) {
    if (resource === "places") filter.types = query.type.toUpperCase();
    if (resource === "merchants") filter.categories = query.type.toLowerCase();
    if (resource === "events") filter.tags = query.type.toLowerCase();
  }
  if (query.q && resource !== "areas") filter.$text = { $search: query.q };
  if (resource === "events") {
    filter.startsAt = { $gte: query.startsAfter || new Date() };
    if (query.endsBefore) filter.startsAt.$lte = query.endsBefore;
  }
  const locationField = resource === "areas" ? "center" : "location";
  if (query.latitude !== undefined) {
    filter[locationField] = {
      $near: {
        $geometry: geoJson(query),
        $maxDistance: query.radiusMeters,
      },
    };
  }
  return filter;
}

async function listPublic(resource, query) {
  const Model = catalogModels[resource];
  const mongoQuery = Model.find(publicFilter(resource, query)).limit(query.limit + 1);
  if (query.latitude === undefined) mongoQuery.sort({ _id: -1 });
  const documents = await mongoQuery.lean();
  const hasMore = documents.length > query.limit;
  if (hasMore) documents.pop();
  return {
    documents,
    meta: {
      limit: query.limit,
      nextCursor: hasMore && query.latitude === undefined ? String(documents.at(-1)._id) : null,
    },
  };
}

async function getPublic(resource, id) {
  const filter = { _id: id, status: "PUBLISHED", archivedAt: null };
  if (resource === "merchants") filter.verificationStatus = "VERIFIED";
  const document = await catalogModels[resource].findOne(filter).lean();
  if (!document) throw notFound(resource.slice(0, -1));
  return document;
}

async function listAdmin(resource, query) {
  const filter = {
    ...(query.cursor ? { _id: { $lt: query.cursor } } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const documents = await catalogModels[resource]
    .find(filter)
    .sort({ _id: -1 })
    .limit(query.limit + 1)
    .lean();
  const hasMore = documents.length > query.limit;
  if (hasMore) documents.pop();
  return {
    documents,
    meta: {
      limit: query.limit,
      nextCursor: hasMore ? String(documents.at(-1)._id) : null,
    },
  };
}

async function getAdmin(resource, id) {
  const document = await catalogModels[resource].findById(id).lean();
  if (!document) throw notFound(resource.slice(0, -1));
  return document;
}

async function createCatalogResource(resource, input, request) {
  const document = await catalogModels[resource].create({
    ...toPersistence(resource, input),
    createdBy: request.auth.userId,
    updatedBy: request.auth.userId,
  });
  return document;
}

async function validateEventPatch(id, patch) {
  if (!patch.startsAt && !patch.endsAt) return;
  const current = await Event.findById(id).select("startsAt endsAt").lean();
  if (!current) throw notFound("event");
  const startsAt = patch.startsAt || current.startsAt;
  const endsAt = patch.endsAt || current.endsAt;
  if (startsAt >= endsAt) {
    throw badRequest("INVALID_EVENT_DATES", "endsAt must be after startsAt");
  }
}

async function updateCatalogResource(resource, id, input, request) {
  const { expectedVersion, ...fields } = input;
  const patch = toPersistence(resource, fields);
  if (resource === "events") await validateEventPatch(id, patch);
  patch.updatedBy = request.auth.userId;

  const document = await catalogModels[resource].findOneAndUpdate(
    { _id: id, version: expectedVersion, status: { $ne: "ARCHIVED" } },
    { $set: patch, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!document) {
    if (await catalogModels[resource].exists({ _id: id })) {
      throw conflict("VERSION_CONFLICT", "The resource changed; reload it before updating");
    }
    throw notFound(resource.slice(0, -1));
  }

  return document;
}

function assertPublishable(resource, document) {
  if (!document.sourceRefs?.length || !document.lastVerifiedAt) {
    throw badRequest(
      "VERIFICATION_REQUIRED",
      "Publishing requires at least one source and lastVerifiedAt",
    );
  }
  if (resource === "merchants" && document.verificationStatus !== "VERIFIED") {
    throw badRequest("MERCHANT_NOT_VERIFIED", "Only verified merchants may be published");
  }
}

async function publishCatalogResource(resource, id, expectedVersion, request) {
  const current = await catalogModels[resource].findById(id).lean();
  if (!current) throw notFound(resource.slice(0, -1));
  assertPublishable(resource, current);
  const document = await catalogModels[resource].findOneAndUpdate(
    { _id: id, version: expectedVersion, status: { $ne: "ARCHIVED" } },
    {
      $set: {
        status: "PUBLISHED",
        verifiedBy: request.auth.userId,
        updatedBy: request.auth.userId,
      },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!document) throw conflict("VERSION_CONFLICT", "The resource changed; reload it first");
  return document;
}

async function archiveCatalogResource(resource, id, expectedVersion, request) {
  const document = await catalogModels[resource].findOneAndUpdate(
    { _id: id, version: expectedVersion, status: { $ne: "ARCHIVED" } },
    {
      $set: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        updatedBy: request.auth.userId,
      },
      $inc: { version: 1 },
    },
    { new: true },
  );
  if (!document) {
    if (await catalogModels[resource].exists({ _id: id })) {
      throw conflict("VERSION_CONFLICT", "The resource changed or is already archived");
    }
    throw notFound(resource.slice(0, -1));
  }
  return document;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveArea(input) {
  let databaseMatches;
  if (input.query) {
    const match = new RegExp(escapeRegex(input.query), "i");
    databaseMatches = await Area.find({
      status: "PUBLISHED",
      archivedAt: null,
      $or: [{ name: match }, { city: match }, { postalCodes: input.query }],
    })
      .limit(10)
      .lean();
  } else {
    databaseMatches = await Area.find({
      status: "PUBLISHED",
      archivedAt: null,
      center: { $near: { $geometry: geoJson(input), $maxDistance: 50_000 } },
    })
      .limit(10)
      .lean();
  }

  if (databaseMatches.length || !input.query) {
    return { source: "catalog", areas: databaseMatches, candidates: [] };
  }
  return { source: "geocoder", areas: [], candidates: await geocodeLocation(input.query) };
}

export {
  catalogModels,
  listPublic,
  getPublic,
  listAdmin,
  getAdmin,
  createCatalogResource,
  updateCatalogResource,
  publishCatalogResource,
  archiveCatalogResource,
  resolveArea,
};
