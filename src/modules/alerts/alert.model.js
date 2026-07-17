import mongoose from "mongoose";

import { ALERT_TYPES, ALERT_SEVERITIES } from "../../common/constants/index.js";

const alertSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ALERT_TYPES, required: true },
    severity: { type: String, enum: ALERT_SEVERITIES, required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    summary: { type: String, required: true, trim: true, maxlength: 1000 },
    sourceUrl: { type: String, trim: true, maxlength: 1000 },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area" },
    city: { type: String, trim: true, maxlength: 100 },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: "version",
    toJSON: {
      transform(_document, value) {
        delete value.__v;
        return value;
      },
    },
  },
);

alertSchema.index({ active: 1, validUntil: 1, city: 1 });

const Alert = mongoose.models.Alert || mongoose.model("Alert", alertSchema);

export { Alert };
