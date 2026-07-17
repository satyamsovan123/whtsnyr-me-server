import mongoose from "mongoose";

import { CURRENCY_CODES, PLACE_TYPES, PRICE_BANDS } from "./catalog.constants.js";
import {
  catalogSchemaOptions,
  commonCatalogFields,
  geoPointSchema,
} from "./catalog.schema-parts.js";

const placeSchema = new mongoose.Schema(
  {
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, maxlength: 140 },
    summary: { type: String, required: true, trim: true, maxlength: 1200 },
    types: { type: [{ type: String, enum: PLACE_TYPES }], required: true },
    location: { type: geoPointSchema, required: true },
    address: {
      line1: { type: String, maxlength: 200 },
      locality: { type: String, maxlength: 120 },
      city: { type: String, maxlength: 100 },
      postalCode: { type: String, maxlength: 12 },
    },
    visitDurationMinutes: { type: Number, min: 15, max: 720, default: 60 },
    priceBand: { type: String, enum: PRICE_BANDS, default: "FREE" },
    entryFeeMinor: { type: Number, min: 0, default: 0 },
    currency: { type: String, enum: CURRENCY_CODES, default: "INR" },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 40 }],
    accessibility: {
      wheelchairAccessible: { type: Boolean },
      accessibleRestroom: { type: Boolean },
      seatingAvailable: { type: Boolean },
      notes: { type: String, maxlength: 600 },
    },
    familyFriendly: { type: Boolean, default: false },
    indoor: { type: Boolean, default: false },
    openingHours: { type: mongoose.Schema.Types.Mixed },
    mediaUrls: [{ type: String, maxlength: 1000 }],
    ...commonCatalogFields,
  },
  catalogSchemaOptions,
);

placeSchema.index({ areaId: 1, slug: 1 }, { unique: true });
placeSchema.index({ location: "2dsphere" });
placeSchema.index({ areaId: 1, status: 1, types: 1, _id: 1 });
placeSchema.index(
  { name: "text", summary: "text", tags: "text" },
  { weights: { name: 5, tags: 3 } },
);
placeSchema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);

const Place = mongoose.models.Place || mongoose.model("Place", placeSchema);

export { Place };
