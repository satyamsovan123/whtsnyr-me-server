import mongoose from "mongoose";

import {
  REPORT_REASONS,
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
} from "../../common/constants/index.js";

const contentReportSchema = new mongoose.Schema(
  {
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    target: {
      type: {
        type: String,
        enum: REPORT_TARGET_TYPES,
        required: true,
      },
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
    },
    details: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "OPEN",
      index: true,
    },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolution: { type: String, trim: true, maxlength: 2000 },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: "version",
  },
);

contentReportSchema.index({ reporterId: 1, createdAt: -1 });
contentReportSchema.index({ status: 1, createdAt: 1 });
contentReportSchema.index({ "target.type": 1, "target.id": 1, status: 1 });

const ContentReport =
  mongoose.models.ContentReport || mongoose.model("ContentReport", contentReportSchema);

export { ContentReport };
