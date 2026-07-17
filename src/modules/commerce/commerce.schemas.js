import { z } from "zod";

import { objectIdSchema } from "../auth/auth.schemas.js";

const dineoutIntentSchema = z
  .object({
    restaurantId: z.string().trim().min(1).max(200),
    restaurantName: z.string().trim().min(1).max(200).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD"),
    slotId: z.number().int().positive(),
    itemId: z.string().trim().min(1).max(300),
    reservationTime: z.number().int().positive(),
    guestCount: z.number().int().min(1).max(20),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  })
  .strict();

const createActionSchema = z.object({
  body: z
    .object({
      operation: z.literal("DINEOUT_BOOKING"),
      intent: dineoutIntentSchema,
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const updateActionSchema = z.object({
  body: z
    .object({
      expectedVersion: z.number().int().min(0),
      intent: dineoutIntentSchema,
    })
    .strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const actionTransitionSchema = z.object({
  body: z.object({ expectedVersion: z.number().int().min(0) }).strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const confirmActionSchema = z.object({
  body: z
    .object({
      expectedVersion: z.number().int().min(0),
      previewHash: z.string().regex(/^[a-f\d]{64}$/i),
    })
    .strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z
    .object({
      "idempotency-key": z.string().trim().min(16).max(128),
    })
    .passthrough(),
});

const actionIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const actionListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      state: z
        .enum([
          "DRAFT",
          "PREVIEWED",
          "SUBMITTING",
          "SUBMITTED",
          "RECONCILED",
          "RECONCILIATION_REQUIRED",
          "FAILED",
          "EXPIRED",
          "CANCELLED",
        ])
        .optional(),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

export {
  dineoutIntentSchema,
  createActionSchema,
  updateActionSchema,
  actionTransitionSchema,
  confirmActionSchema,
  actionIdSchema,
  actionListSchema,
};
