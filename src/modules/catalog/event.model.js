import mongoose from "mongoose";

import { PRICE_BANDS } from "./catalog.constants.js";
import {
  catalogSchemaOptions,
  commonCatalogFields,
  geoPointSchema,
} from "./catalog.schema-parts.js";

const eventSchema = new mongoose.Schema(
  {
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true, index: true },
    placeId: { type: mongoose.Schema.Types.ObjectId, ref: "Place", index: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, trim: true, maxlength: 140 },
    summary: { type: String, required: true, trim: true, maxlength: 1200 },
    location: { type: geoPointSchema, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    timezone: { type: String, required: true, default: "Asia/Kolkata", maxlength: 80 },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    priceBand: { type: String, enum: PRICE_BANDS, default: "FREE" },
    priceMinor: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: ["INR"], default: "INR" },
    bookingUrl: { type: String, maxlength: 1000 },
    seriesKey: { type: String, maxlength: 160 },
    ...commonCatalogFields,
  },
  catalogSchemaOptions,
);

eventSchema.pre("validate", function ensureChronology(next) {
  if (this.startsAt && this.endsAt && this.startsAt >= this.endsAt) {
    this.invalidate("endsAt", "endsAt must be after startsAt");
  }
  next();
});
eventSchema.index({ areaId: 1, slug: 1 }, { unique: true });
eventSchema.index({ areaId: 1, status: 1, startsAt: 1, _id: 1 });
eventSchema.index({ placeId: 1, startsAt: 1 });
eventSchema.index({ location: "2dsphere" });
eventSchema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);

const Event = mongoose.models.Event || mongoose.model("Event", eventSchema);

export { Event };
