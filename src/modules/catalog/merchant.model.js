import mongoose from "mongoose";

import { PRICE_BANDS } from "./catalog.constants.js";
import {
  catalogSchemaOptions,
  commonCatalogFields,
  geoPointSchema,
} from "./catalog.schema-parts.js";

const merchantSchema = new mongoose.Schema(
  {
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, maxlength: 140 },
    summary: { type: String, required: true, trim: true, maxlength: 1200 },
    location: { type: geoPointSchema, required: true },
    categories: [{ type: String, required: true, trim: true, lowercase: true, maxlength: 60 }],
    craftProvenance: { type: String, maxlength: 1200 },
    priceBand: { type: String, enum: PRICE_BANDS, default: "BUDGET" },
    fulfillmentModes: [
      { type: String, enum: ["PICKUP", "LOCAL_DELIVERY", "NATIONAL_SHIPPING", "CONTACT_ONLY"] },
    ],
    contact: {
      phone: { type: String, maxlength: 30 },
      website: { type: String, maxlength: 1000 },
    },
    verificationStatus: {
      type: String,
      enum: ["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"],
      default: "UNVERIFIED",
      index: true,
    },
    ...commonCatalogFields,
  },
  catalogSchemaOptions,
);

merchantSchema.index({ areaId: 1, slug: 1 }, { unique: true });
merchantSchema.index({ location: "2dsphere" });
merchantSchema.index({ areaId: 1, status: 1, categories: 1 });
merchantSchema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);

const Merchant = mongoose.models.Merchant || mongoose.model("Merchant", merchantSchema);

export { Merchant };
