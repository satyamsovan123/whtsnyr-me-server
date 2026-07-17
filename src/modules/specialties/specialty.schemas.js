import { z } from "zod";

import { objectIdSchema } from "../auth/auth.schemas.js";
import { CATALOG_STATUSES, SPECIALTY_CATEGORIES, SOURCE_TYPES } from "../../common/constants/index.js";

const sourceRef = z
  .object({
    url: z.string().url().max(1000),
    label: z.string().trim().max(120).optional(),
    sourceType: z.enum(SOURCE_TYPES),
  })
  .strict();

const commonCreate = {
  sourceRefs: z.array(sourceRef).max(12).default([]),
  sourceKey: z.string().trim().min(1).max(160).optional(),
  lastVerifiedAt: z.coerce.date().max(new Date()).optional(),
};

const specialtyInput = z
  .object({
    areaId: objectIdSchema,
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().min(2).max(140).optional(),
    category: z.enum(SPECIALTY_CATEGORIES),
    description: z.string().trim().min(10).max(1200),
    whyFamous: z.string().trim().max(800).optional(),
    whereToFind: z.array(
      z.object({
        placeId: objectIdSchema.optional(),
        merchantId: objectIdSchema.optional(),
        description: z.string().trim().max(500).optional(),
      }).strict()
    ).max(10).default([]),
    swiggySearchQuery: z.string().trim().max(100).optional(),
    seasonalAvailability: z.string().trim().max(200).optional(),
    priceRange: z.string().trim().max(100).optional(),
    mediaUrls: z.array(z.string().url().max(1000)).max(20).default([]),
    ...commonCreate,
  })
  .strict();

function requestWithBody(bodySchema) {
  return z.object({
    body: bodySchema,
    params: z.object({}),
    query: z.object({}),
    headers: z.object({}).passthrough(),
  });
}

const createSchema = requestWithBody(specialtyInput);

const updateSchema = z.object({
  body: specialtyInput
    .partial()
    .extend({ expectedVersion: z.number().int().min(0) })
    .refine((value) => Object.keys(value).length > 1, "At least one update field is required"),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const getByIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const transitionSchema = z.object({
  body: z.object({ expectedVersion: z.number().int().min(0) }).strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const listPublicSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      areaId: objectIdSchema.optional(),
      q: z.string().trim().min(1).max(100).optional(),
      category: z.enum(SPECIALTY_CATEGORIES).optional(),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

const adminListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      status: z.enum(CATALOG_STATUSES).optional(),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

const swiggySearchSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: objectIdSchema }),
  query: z
    .object({
      addressId: z.string().trim().min(1).max(100),
      server: z.enum(["food", "instamart"]).default("food"),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

export {
  specialtyInput,
  createSchema,
  updateSchema,
  getByIdSchema,
  transitionSchema,
  listPublicSchema,
  adminListSchema,
  swiggySearchSchema,
};
