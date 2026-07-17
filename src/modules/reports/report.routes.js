import { Router } from "express";

import { authenticate, authorize } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  createReport,
  getOwnReport,
  listAllReports,
  listOwnReports,
  updateReport,
} from "./report.controller.js";
import {
  createReportSchema,
  reportIdSchema,
  reportListSchema,
  updateReportSchema,
} from "./report.schemas.js";

const reportRouter = Router();
reportRouter.use(authenticate);
reportRouter.post("/", validate(createReportSchema), asyncHandler(createReport));
reportRouter.get("/", validate(reportListSchema), asyncHandler(listOwnReports));
reportRouter.get("/:id", validate(reportIdSchema), asyncHandler(getOwnReport));

const adminReportRouter = Router();
adminReportRouter.use(authenticate, authorize("CURATOR", "ADMIN"));
adminReportRouter.get("/", validate(reportListSchema), asyncHandler(listAllReports));
adminReportRouter.patch("/:id", validate(updateReportSchema), asyncHandler(updateReport));

export { reportRouter, adminReportRouter };
