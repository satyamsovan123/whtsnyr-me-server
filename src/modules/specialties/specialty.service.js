import { conflict, notFound, badRequest } from "../../common/errors/app-error.js";
import { toSlug } from "../../common/utils/slug.js";
import { Specialty } from "./specialty.model.js";

const allowedFields = [
  "areaId",
  "name",
  "slug",
  "category",
  "description",
  "whyFamous",
  "whereToFind",
  "swiggySearchQuery",
  "seasonalAvailability",
  "priceRange",
  "mediaUrls",
  "sourceRefs",
  "sourceKey",
  "lastVerifiedAt",
];

function toPersistence(input) {
  const output = {};
  for (const field of allowedFields) {
    if (input[field] !== undefined) output[field] = input[field];
  }
  if (!output.slug && output.name) output.slug = toSlug(output.name);
  return output;
}

function publicFilter(query) {
  const filter = { status: "PUBLISHED", archivedAt: null };
  if (query.areaId) filter.areaId = query.areaId;
  if (query.cursor) filter._id = { $lt: query.cursor };
  if (query.category) filter.category = query.category;
  if (query.q) filter.$text = { $search: query.q };
  return filter;
}

async function listPublic(query) {
  const filter = publicFilter(query);
  const mongoQuery = Specialty.find(filter).limit(query.limit + 1);
  mongoQuery.sort({ _id: -1 });
  const documents = await mongoQuery.lean();
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

async function getPublic(id) {
  const document = await Specialty.findOne({
    _id: id,
    status: "PUBLISHED",
    archivedAt: null,
  }).lean();
  if (!document) throw notFound("specialty");
  return document;
}

async function listAdmin(query) {
  const filter = {
    ...(query.cursor ? { _id: { $lt: query.cursor } } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const documents = await Specialty.find(filter)
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

async function getAdmin(id) {
  const document = await Specialty.findById(id).lean();
  if (!document) throw notFound("specialty");
  return document;
}

async function createSpecialty(input, request) {
  const document = await Specialty.create({
    ...toPersistence(input),
    createdBy: request.auth.userId,
    updatedBy: request.auth.userId,
  });
  return document;
}

async function updateSpecialty(id, input, request) {
  const { expectedVersion, ...fields } = input;
  const patch = toPersistence(fields);
  patch.updatedBy = request.auth.userId;

  const document = await Specialty.findOneAndUpdate(
    { _id: id, version: expectedVersion, status: { $ne: "ARCHIVED" } },
    { $set: patch, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!document) {
    if (await Specialty.exists({ _id: id })) {
      throw conflict("VERSION_CONFLICT", "The resource changed; reload it before updating");
    }
    throw notFound("specialty");
  }

  return document;
}

function assertPublishable(document) {
  if (!document.sourceRefs?.length || !document.lastVerifiedAt) {
    throw badRequest(
      "VERIFICATION_REQUIRED",
      "Publishing requires at least one source and lastVerifiedAt",
    );
  }
}

async function publishSpecialty(id, expectedVersion, request) {
  const current = await Specialty.findById(id).lean();
  if (!current) throw notFound("specialty");
  assertPublishable(current);
  const document = await Specialty.findOneAndUpdate(
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

async function archiveSpecialty(id, expectedVersion, request) {
  const document = await Specialty.findOneAndUpdate(
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
    if (await Specialty.exists({ _id: id })) {
      throw conflict("VERSION_CONFLICT", "The resource changed or is already archived");
    }
    throw notFound("specialty");
  }
  return document;
}

export {
  listPublic,
  getPublic,
  listAdmin,
  getAdmin,
  createSpecialty,
  updateSpecialty,
  publishSpecialty,
  archiveSpecialty,
};
