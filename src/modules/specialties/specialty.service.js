import { conflict, notFound, badRequest } from "../../common/errors/app-error.js";
import { toSlug } from "../../common/utils/slug.js";
import { Specialty } from "./specialty.model.js";
import { findNearbyPlaces } from "../providers/places.service.js";
import { callSwiggyReadTool } from "../providers/swiggy-mcp.service.js";

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

async function listPublic(query, userId) {
  if (query.latitude && query.longitude) {
    const documents = [];
    const lat = parseFloat(query.latitude);
    const lng = parseFloat(query.longitude);

    if (userId) {
      let addressId = null;
      try {
        const addrs = await callSwiggyReadTool(userId, "food", "get_addresses", {});
        if (addrs && Array.isArray(addrs.addresses) && addrs.addresses.length > 0) {
           addressId = addrs.addresses[0].id;
        } else if (Array.isArray(addrs) && addrs.length > 0) {
           addressId = addrs[0].id;
        }
      } catch (e) {
        console.error("Swiggy get_addresses error:", e);
      }

      if (addressId) {
        try {
          const food = await callSwiggyReadTool(userId, "food", "search_restaurants", {
            query: "famous local food", addressId
          });
          if (Array.isArray(food)) {
             documents.push(...food.slice(0, 3).map(f => ({
               name: f.name || f.title,
               description: (f.cuisines ? f.cuisines.join(", ") : null) || f.description || "Popular local food spot",
               mediaUrls: f.imageId ? [`https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_660/${f.imageId}`] : []
             })));
          }
        } catch (e) {
          console.error("Swiggy food error in specialties:", e);
        }

        try {
          const instamart = await callSwiggyReadTool(userId, "instamart", "search_products", {
            query: "local souvenir", addressId
          });
          if (Array.isArray(instamart)) {
             documents.push(...instamart.slice(0, 3).map(i => ({
               name: i.name || i.title,
               description: i.category || i.description || "Local item available on Instamart",
               mediaUrls: i.imageId ? [`https://instamart-media-assets.swiggy.com/instamart/image/upload/fl_lossy,f_auto,q_auto,w_660/${i.imageId}`] : []
             })));
          }
        } catch (e) {
          console.error("Swiggy instamart error in specialties:", e);
        }
      }
    }

    for (let i = documents.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [documents[i], documents[j]] = [documents[j], documents[i]];
    }

    if (documents.length > 0) {
      return { documents, meta: { limit: query.limit, nextCursor: null } };
    }
  }

  const filter = publicFilter(query);
  const mongoQuery = Specialty.find(filter).limit(query.limit + 1);
  mongoQuery.sort({ _id: -1 });
  const dbDocs = await mongoQuery.lean();
  const hasMore = dbDocs.length > query.limit;
  if (hasMore) dbDocs.pop();
  return {
    documents: dbDocs,
    meta: {
      limit: query.limit,
      nextCursor: hasMore ? String(dbDocs.at(-1)._id) : null,
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
