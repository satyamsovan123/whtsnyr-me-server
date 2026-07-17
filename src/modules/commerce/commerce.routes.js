import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.js";
import { providerRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  cancelAction,
  confirmAction,
  createAction,
  getAction,
  listActions,
  previewAction,
  updateAction,
} from "./commerce.controller.js";
import {
  actionIdSchema,
  actionListSchema,
  actionTransitionSchema,
  confirmActionSchema,
  createActionSchema,
  updateActionSchema,
} from "./commerce.schemas.js";

const commerceActionRouter = Router();
commerceActionRouter.use(authenticate, providerRateLimit);
commerceActionRouter.post("/", validate(createActionSchema), asyncHandler(createAction));
commerceActionRouter.get("/", validate(actionListSchema), asyncHandler(listActions));
commerceActionRouter.get("/:id", validate(actionIdSchema), asyncHandler(getAction));
commerceActionRouter.patch("/:id", validate(updateActionSchema), asyncHandler(updateAction));
commerceActionRouter.post(
  "/:id/preview",
  validate(actionTransitionSchema),
  asyncHandler(previewAction),
);
commerceActionRouter.post(
  "/:id/confirm",
  validate(confirmActionSchema),
  asyncHandler(confirmAction),
);
commerceActionRouter.post(
  "/:id/cancel",
  validate(actionTransitionSchema),
  asyncHandler(cancelAction),
);

export { commerceActionRouter };
