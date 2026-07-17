import { z } from "zod";

import { objectIdSchema } from "../auth/auth.schemas.js";
import {
  CATALOG_STATUSES,
  FULFILLMENT_MODES,
  MERCHANT_VERIFICATION_STATUSES,
  PLACE_TYPES,
  PRICE_BANDS,
  SOURCE_TYPES,
} from "./catalog.constants.js";

const geoInput = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

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

const areaInput = z
  .object({
    name: z.string().trim().min(2).max(120),
    slug: z.string().trim().min(2).max(120).optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    country: z.string().trim().min(2).max(100).default("India"),
    postalCodes: z.array(z.string().trim().min(3).max(12)).max(30).default([]),
    timezone: z.string().trim().min(3).max(80).default("Asia/Kolkata"),
    center: geoInput,
    description: z.string().trim().max(1200).optional(),
    ...commonCreate,
  })
  .strict();

const placeInput = z
  .object({
    areaId: objectIdSchema,
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().min(2).max(140).optional(),
    summary: z.string().trim().min(20).max(1200),
    types: z.array(z.enum(PLACE_TYPES)).min(1).max(6),
    location: geoInput,
    address: z
      .object({
        line1: z.string().trim().max(200).optional(),
        locality: z.string().trim().max(120).optional(),
        city: z.string().trim().max(100).optional(),
        postalCode: z.string().trim().max(12).optional(),
      })
      .strict()
      .optional(),
    visitDurationMinutes: z.number().int().min(15).max(720).default(60),
    priceBand: z.enum(PRICE_BANDS).default("FREE"),
    entryFeeMinor: z.number().int().min(0).default(0),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    accessibility: z
      .object({
        wheelchairAccessible: z.boolean().optional(),
        accessibleRestroom: z.boolean().optional(),
        seatingAvailable: z.boolean().optional(),
        notes: z.string().trim().max(600).optional(),
      })
      .strict()
      .optional(),
    familyFriendly: z.boolean().default(false),
    indoor: z.boolean().default(false),
    openingHours: z.record(z.string(), z.unknown()).optional(),
    mediaUrls: z.array(z.string().url().max(1000)).max(20).default([]),
    ...commonCreate,
  })
  .strict();

const eventBaseInput = z
  .object({
    areaId: objectIdSchema,
    placeId: objectIdSchema.optional(),
    name: z.string().trim().min(2).max(180),
    slug: z.string().trim().min(2).max(140).optional(),
    summary: z.string().trim().min(20).max(1200),
    location: geoInput,
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    timezone: z.string().trim().min(3).max(80).default("Asia/Kolkata"),
    tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
    priceBand: z.enum(PRICE_BANDS).default("FREE"),
    priceMinor: z.number().int().min(0).default(0),
    bookingUrl: z.string().url().max(1000).optional(),
    seriesKey: z.string().trim().max(160).optional(),
    ...commonCreate,
  })
  .strict();

const eventInput = eventBaseInput.refine((value) => value.startsAt < value.endsAt, {
  path: ["endsAt"],
  message: "endsAt must be after startsAt",
});

const merchantInput = z
  .object({
    areaId: objectIdSchema,
    name: z.string().trim().min(2).max(160),
    slug: z.string().trim().min(2).max(140).optional(),
    summary: z.string().trim().min(20).max(1200),
    location: geoInput,
    categories: z.array(z.string().trim().min(1).max(60)).min(1).max(20),
    craftProvenance: z.string().trim().max(1200).optional(),
    priceBand: z.enum(PRICE_BANDS).default("BUDGET"),
    fulfillmentModes: z.array(z.enum(FULFILLMENT_MODES)).max(4).default(["CONTACT_ONLY"]),
    contact: z
      .object({
        phone: z.string().trim().max(30).optional(),
        website: z.string().url().max(1000).optional(),
      })
      .strict()
      .optional(),
    verificationStatus: z.enum(MERCHANT_VERIFICATION_STATUSES).default("UNVERIFIED"),
    ...commonCreate,
  })
  .strict();

const resourceInputs = {
  areas: areaInput,
  places: placeInput,
  events: eventInput,
  merchants: merchantInput,
};

const resourceUpdateInputs = {
  ...resourceInputs,
  events: eventBaseInput,
};

function requestWithBody(bodySchema) {
  return z.object({
    body: bodySchema,
    params: z.object({}),
    query: z.object({}),
    headers: z.object({}).passthrough(),
  });
}

const createSchemas = Object.fromEntries(
  Object.entries(resourceInputs).map(([key, schema]) => [key, requestWithBody(schema)]),
);

const updateSchemas = Object.fromEntries(
  Object.entries(resourceUpdateInputs).map(([key, schema]) => [
    key,
    z.object({
      body: schema
        .partial()
        .extend({ expectedVersion: z.number().int().min(0) })
        .refine((value) => Object.keys(value).length > 1, "At least one update field is required"),
      params: z.object({ id: objectIdSchema }),
      query: z.object({}),
      headers: z.object({}).passthrough(),
    }),
  ]),
);

const catalogIdSchema = z.object({
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

const publicListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      areaId: objectIdSchema.optional(),
      q: z.string().trim().min(1).max(100).optional(),
      type: z.string().trim().min(1).max(60).optional(),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
      radiusMeters: z.coerce.number().int().min(100).max(50_000).default(10_000),
      startsAfter: z.coerce.date().optional(),
      endsBefore: z.coerce.date().optional(),
    })
    .strict()
    .refine((value) => (value.latitude === undefined) === (value.longitude === undefined), {
      message: "latitude and longitude must be supplied together",
    }),
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

const resolveAreaSchema = z.object({
  body: z
    .object({
      query: z.string().trim().min(2).max(180).optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
    })
    .strict()
    .refine(
      (value) =>
        Boolean(value.query) !==
        Boolean(value.latitude !== undefined && value.longitude !== undefined),
      "Provide either query or latitude/longitude",
    ),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

export {
  areaInput,
  placeInput,
  eventInput,
  merchantInput,
  resourceInputs,
  createSchemas,
  updateSchemas,
  catalogIdSchema,
  transitionSchema,
  publicListSchema,
  adminListSchema,
  resolveAreaSchema,
};
