import mongoose from "mongoose";

import { SPECIALTY_CATEGORIES } from "../../common/constants/index.js";
import {
  catalogSchemaOptions,
  commonCatalogFields,
} from "../catalog/catalog.schema-parts.js";

const specialtySchema = new mongoose.Schema(
  {
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, trim: true, maxlength: 140 },
    category: { type: String, enum: SPECIALTY_CATEGORIES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 1200 },
    whyFamous: { type: String, trim: true, maxlength: 800 },
    whereToFind: [
      {
        placeId: { type: mongoose.Schema.Types.ObjectId, ref: "Place" },
        merchantId: { type: mongoose.Schema.Types.ObjectId, ref: "Merchant" },
        description: { type: String, maxlength: 500 },
      },
    ],
    swiggySearchQuery: { type: String, trim: true, maxlength: 100 },
    seasonalAvailability: { type: String, trim: true, maxlength: 200 },
    priceRange: { type: String, trim: true, maxlength: 100 },
    mediaUrls: [{ type: String, maxlength: 1000 }],
    ...commonCatalogFields,
  },
  catalogSchemaOptions,
);

specialtySchema.index({ areaId: 1, slug: 1 }, { unique: true });
specialtySchema.index({ areaId: 1, status: 1, category: 1 });
specialtySchema.index(
  { name: "text", description: "text" },
  { weights: { name: 5, description: 2 } },
);
specialtySchema.index(
  { sourceKey: 1 },
  { unique: true, partialFilterExpression: { sourceKey: { $type: "string" } } },
);

const Specialty = mongoose.models.Specialty || mongoose.model("Specialty", specialtySchema);

export { Specialty };
