import { Router } from "express";

import { asyncHandler } from "../../common/utils/async-handler.js";
import { authenticate, authorize } from "../../common/middleware/auth.js";
import { authRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import {
  getMe,
  listUsers,
  login,
  register,
  updateMe,
  updateUserRoles,
  updateUserStatus,
} from "./auth.controller.js";
import {
  loginSchema,
  registerSchema,
  updateMeSchema,
  updateUserRolesSchema,
  updateUserStatusSchema,
  userListSchema,
} from "./auth.schemas.js";

const authRouter = Router();
authRouter.post("/register", authRateLimit, validate(registerSchema), asyncHandler(register));
authRouter.post("/login", authRateLimit, validate(loginSchema), asyncHandler(login));

const meRouter = Router();
meRouter.use(authenticate);
meRouter.get("/", asyncHandler(getMe));
meRouter.patch("/", validate(updateMeSchema), asyncHandler(updateMe));

const adminUserRouter = Router();
adminUserRouter.use(authenticate, authorize("ADMIN"));
adminUserRouter.get("/", validate(userListSchema), asyncHandler(listUsers));
adminUserRouter.patch(
  "/:id/status",
  validate(updateUserStatusSchema),
  asyncHandler(updateUserStatus),
);
adminUserRouter.put("/:id/roles", validate(updateUserRolesSchema), asyncHandler(updateUserRoles));

export { authRouter, meRouter, adminUserRouter };
