import { z } from "zod";

import { objectIdSchema } from "../auth/auth.schemas.js";
import { ALERT_TYPES, ALERT_SEVERITIES } from "../../common/constants/index.js";

const listAlertsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      areaId: objectIdSchema.optional(),
      city: z.string().trim().max(100).optional(),
      latitude: z.coerce.number().min(-90).max(90).optional(),
      longitude: z.coerce.number().min(-180).max(180).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .strict()
    .refine((value) => (value.latitude === undefined) === (value.longitude === undefined), {
      message: "latitude and longitude must be supplied together",
    }),
  headers: z.object({}).passthrough(),
});

const createAlertSchema = z.object({
  body: z
    .object({
      type: z.enum(ALERT_TYPES),
      severity: z.enum(ALERT_SEVERITIES),
      title: z.string().trim().min(2).max(200),
      summary: z.string().trim().min(5).max(1000),
      sourceUrl: z.string().url().max(1000).optional(),
      areaId: objectIdSchema.optional(),
      city: z.string().trim().max(100).optional(),
      validFrom: z.coerce.date().optional(),
      validUntil: z.coerce.date().optional(),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const updateAlertSchema = z.object({
  body: z
    .object({
      active: z.boolean().optional(),
      title: z.string().trim().min(2).max(200).optional(),
      summary: z.string().trim().min(5).max(1000).optional(),
      severity: z.enum(ALERT_SEVERITIES).optional(),
      validUntil: z.coerce.date().optional(),
      expectedVersion: z.number().int().min(0),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 1, "At least one update field is required"),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const getAlertsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

export { listAlertsSchema, createAlertSchema, updateAlertSchema, getAlertsSchema };
