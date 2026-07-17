import mongoose from "mongoose";

import {
  GEO_POINT_TYPES,
  ITINERARY_DURATION_HOURS,
  ITINERARY_STATUSES,
  MOBILITY_OPTIONS,
} from "../../common/constants/index.js";

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: GEO_POINT_TYPES, default: "Point", required: true },
    coordinates: { type: [Number], required: true },
  },
  { _id: false },
);

const stopSchema = new mongoose.Schema(
  {
    position: { type: Number, required: true, min: 0 },
    placeId: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    travelMinutes: { type: Number, min: 0, default: 0 },
    distanceKm: { type: Number, min: 0, default: 0 },
    snapshot: {
      name: { type: String, required: true },
      summary: { type: String, required: true },
      location: { type: pointSchema, required: true },
      types: [{ type: String }],
      priceBand: { type: String },
      entryFeeMinor: { type: Number, min: 0 },
      lastVerifiedAt: { type: Date, required: true },
    },
  },
  { _id: false },
);

const itinerarySchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: "Area", required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 2000 },
    constraints: {
      durationHours: { type: Number, enum: ITINERARY_DURATION_HOURS, required: true },
      startAt: { type: Date, required: true },
      budgetMinor: { type: Number, min: 0 },
      groupSize: { type: Number, min: 1, max: 30, default: 1 },
      interests: [{ type: String, maxlength: 40 }],
      placeTypes: [{ type: String, maxlength: 40 }],
      mobility: {
        type: String,
        enum: MOBILITY_OPTIONS,
        default: "STANDARD",
      },
      indoorPreference: { type: Boolean },
      startLocation: { type: pointSchema },
    },
    stops: { type: [stopSchema], default: [] },
    alternatives: { type: [stopSchema], default: [] },
    totals: {
      durationMinutes: { type: Number, min: 0 },
      estimatedCostMinor: { type: Number, min: 0 },
      walkingDistanceKm: { type: Number, min: 0 },
    },
    plannerVersion: { type: String, required: true, default: "verified-greedy-v1" },
    plannerNotes: [{ type: String, maxlength: 300 }],
    status: {
      type: String,
      enum: ITINERARY_STATUSES,
      default: "DRAFT",
      index: true,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: "version",
  },
);

itinerarySchema.index({ ownerId: 1, status: 1, updatedAt: -1, _id: -1 });

const Itinerary = mongoose.models.Itinerary || mongoose.model("Itinerary", itinerarySchema);

export { Itinerary };
