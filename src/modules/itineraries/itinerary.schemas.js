import { z } from "zod";

import { objectIdSchema } from "../auth/auth.schemas.js";
import { PLACE_TYPES } from "../catalog/catalog.constants.js";

const coordinateInput = z
  .object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

const constraintInput = z
  .object({
    areaId: objectIdSchema,
    durationHours: z.union([z.literal(2), z.literal(4), z.literal(8)]),
    startAt: z.coerce.date().optional(),
    budgetMinor: z.number().int().min(0).max(10_000_000).optional(),
    groupSize: z.number().int().min(1).max(30).default(1),
    interests: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
    placeTypes: z.array(z.enum(PLACE_TYPES)).max(10).default([]),
    mobility: z.enum(["STANDARD", "LOW_WALKING", "WHEELCHAIR_ACCESSIBLE"]).default("STANDARD"),
    indoorPreference: z.boolean().optional(),
    startLocation: coordinateInput.optional(),
  })
  .strict();

const planItinerarySchema = z.object({
  body: constraintInput,
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const itineraryListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      status: z.enum(["DRAFT", "SAVED", "ARCHIVED"]).optional(),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

const itineraryIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const updateItinerarySchema = z.object({
  body: z
    .object({
      expectedVersion: z.number().int().min(0),
      title: z.string().trim().min(2).max(120).optional(),
      notes: z.string().trim().max(2000).optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 1, "At least one update field is required"),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const replanItinerarySchema = z.object({
  body: z
    .object({
      expectedVersion: z.number().int().min(0),
      constraints: constraintInput.partial(),
    })
    .strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const transitionItinerarySchema = z.object({
  body: z.object({ expectedVersion: z.number().int().min(0) }).strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

export {
  constraintInput,
  planItinerarySchema,
  itineraryListSchema,
  itineraryIdSchema,
  updateItinerarySchema,
  replanItinerarySchema,
  transitionItinerarySchema,
};
