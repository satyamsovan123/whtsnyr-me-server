import { Router } from "express";

import { authenticate, authorize, optionalAuthenticate } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  adminArchive,
  adminCreate,
  adminGet,
  adminList,
  adminPublish,
  adminUpdate,
  findOnSwiggy,
  publicGet,
  publicList,
} from "./specialty.controller.js";
import {
  adminListSchema,
  createSchema,
  getByIdSchema,
  listPublicSchema,
  swiggySearchSchema,
  transitionSchema,
  updateSchema,
} from "./specialty.schemas.js";

const specialtyRouter = Router();

specialtyRouter.get("/", optionalAuthenticate, validate(listPublicSchema), asyncHandler(publicList));
specialtyRouter.get("/:id", validate(getByIdSchema), asyncHandler(publicGet));
specialtyRouter.get("/:id/swiggy", authenticate, validate(swiggySearchSchema), asyncHandler(findOnSwiggy));

const adminSpecialtyRouter = Router();

adminSpecialtyRouter.use(authenticate, authorize("CURATOR", "ADMIN"));

adminSpecialtyRouter.get("/", validate(adminListSchema), asyncHandler(adminList));
adminSpecialtyRouter.get("/:id", validate(getByIdSchema), asyncHandler(adminGet));
adminSpecialtyRouter.post("/", validate(createSchema), asyncHandler(adminCreate));
adminSpecialtyRouter.patch("/:id", validate(updateSchema), asyncHandler(adminUpdate));

adminSpecialtyRouter.post(
  "/:id/publish",
  authorize("ADMIN"),
  validate(transitionSchema),
  asyncHandler(adminPublish),
);

adminSpecialtyRouter.post(
  "/:id/archive",
  authorize("ADMIN"),
  validate(transitionSchema),
  asyncHandler(adminArchive),
);

export { specialtyRouter, adminSpecialtyRouter };
