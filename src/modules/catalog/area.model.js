import mongoose from "mongoose";

import {
  catalogSchemaOptions,
  commonCatalogFields,
  geoPointSchema,
} from "./catalog.schema-parts.js";

const areaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    country: { type: String, required: true, trim: true, maxlength: 100, default: "India" },
    postalCodes: [{ type: String, trim: true, maxlength: 12 }],
    timezone: { type: String, required: true, default: "Asia/Kolkata", maxlength: 80 },
    center: { type: geoPointSchema, required: true },
    description: { type: String, trim: true, maxlength: 1200 },
    ...commonCatalogFields,
  },
  catalogSchemaOptions,
);

areaSchema.index({ center: "2dsphere" });
areaSchema.index({ status: 1, postalCodes: 1 });
areaSchema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);

const Area = mongoose.models.Area || mongoose.model("Area", areaSchema);

export { Area };
