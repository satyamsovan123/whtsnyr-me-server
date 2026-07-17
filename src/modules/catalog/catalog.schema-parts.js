import mongoose from "mongoose";

import { CATALOG_STATUSES } from "./catalog.constants.js";

const geoPointDefinition = {
  type: {
    type: String,
    enum: ["Point"],
    required: true,
    default: "Point",
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator(value) {
        return (
          value.length === 2 &&
          value[0] >= -180 &&
          value[0] <= 180 &&
          value[1] >= -90 &&
          value[1] <= 90
        );
      },
      message: "GeoJSON coordinates must be [longitude, latitude]",
    },
  },
};

const geoPointSchema = new mongoose.Schema(geoPointDefinition, { _id: false });

const sourceRefSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, maxlength: 1000 },
    label: { type: String, maxlength: 120 },
    sourceType: {
      type: String,
      enum: ["OFFICIAL", "CURATOR", "MERCHANT", "OPEN_DATA", "OTHER"],
      required: true,
    },
  },
  { _id: false },
);

const commonCatalogFields = {
  status: { type: String, enum: CATALOG_STATUSES, default: "DRAFT", index: true },
  sourceRefs: { type: [sourceRefSchema], default: [] },
  sourceKey: { type: String, trim: true, maxlength: 160 },
  lastVerifiedAt: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  archivedAt: { type: Date },
};

const catalogSchemaOptions = {
  timestamps: true,
  optimisticConcurrency: true,
  versionKey: "version",
  toJSON: {
    transform(_document, value) {
      delete value.__v;
      return value;
    },
  },
};

export {
  geoPointDefinition,
  geoPointSchema,
  sourceRefSchema,
  commonCatalogFields,
  catalogSchemaOptions,
};
