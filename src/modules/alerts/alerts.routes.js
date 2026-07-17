import { Router } from "express";

import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { publicListAlerts, adminCreateAlert, adminListAlerts, adminUpdateAlert } from "./alerts.controller.js";
import { listAlertsSchema, createAlertSchema, updateAlertSchema } from "./alerts.schemas.js";

const alertRouter = Router();

alertRouter.get("/", validate(listAlertsSchema), asyncHandler(publicListAlerts));

const adminAlertRouter = Router();

adminAlertRouter.use(authenticate, authorize("CURATOR", "ADMIN"));

adminAlertRouter.get("/", asyncHandler(adminListAlerts));
adminAlertRouter.post("/", validate(createAlertSchema), asyncHandler(adminCreateAlert));
adminAlertRouter.patch("/:id", validate(updateAlertSchema), asyncHandler(adminUpdateAlert));

export { alertRouter, adminAlertRouter };
