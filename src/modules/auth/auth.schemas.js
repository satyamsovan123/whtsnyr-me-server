import { z } from "zod";

import { MOBILITY_OPTIONS } from "../../common/constants/index.js";
import { USER_ROLES, USER_STATUSES } from "./user.model.js";

const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB object id");

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const passwordSchema = z
  .string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number");

const registerSchema = z.object({
  body: z
    .object({
      email: emailSchema,
      password: passwordSchema,
      displayName: z.string().trim().min(2).max(80),
    })
    .strict(),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const loginSchema = z.object({
  body: z.object({ email: emailSchema, password: z.string().min(1).max(128) }).strict(),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const updateMeSchema = z.object({
  body: z
    .object({
      displayName: z.string().trim().min(2).max(80).optional(),
      preferences: z
        .object({
          dietary: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
          interests: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
          mobility: z.enum(MOBILITY_OPTIONS).optional(),
        })
        .strict()
        .optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, "At least one field is required"),
  params: z.object({}),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const userListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      cursor: objectIdSchema.optional(),
      limit: z.coerce.number().int().min(1).max(100).default(25),
      status: z.enum(USER_STATUSES).optional(),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

const updateUserStatusSchema = z.object({
  body: z.object({ status: z.enum(USER_STATUSES) }).strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

const updateUserRolesSchema = z.object({
  body: z.object({ roles: z.array(z.enum(USER_ROLES)).min(1).max(3) }).strict(),
  params: z.object({ id: objectIdSchema }),
  query: z.object({}),
  headers: z.object({}).passthrough(),
});

export {
  objectIdSchema,
  registerSchema,
  loginSchema,
  updateMeSchema,
  userListSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
};
