import { z } from "zod";

import { REPORT_REASONS, REPORT_STATUSES } from "../../common/constants/index.js";
import { objectIdSchema } from "../auth/auth.schemas.js";

const createReportSchema = z.object({
  body: z
    .object({
      target: z
        .object({
          type: z.enum(["areas", "places", "events", "merchants"]),
          id: objectIdSchema,
        })
        .strict(),
      reason: z.enum(REPORT_REASONS),
      details: z.string().trim().min(10).max(2000),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const reportListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      status: z.enum(REPORT_STATUSES).optional(),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

const reportIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const updateReportSchema = z.object({
  body: z
    .object({
      expectedVersion: z.number().int().min(0),
      status: z.enum(REPORT_STATUSES).optional(),
      assigneeId: objectIdSchema.nullable().optional(),
      resolution: z.string().trim().min(5).max(2000).optional(),
    })
    .strict()
    .refine((value) => Object.keys(value).length > 1, "At least one update field is required"),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

export { createReportSchema, reportListSchema, reportIdSchema, updateReportSchema };
