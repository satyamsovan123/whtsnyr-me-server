import mongoose from "mongoose";

import { COMMERCE_STATES } from "../../common/constants/index.js";

const commerceActionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: ["SWIGGY"], required: true, default: "SWIGGY" },
    operation: { type: String, enum: ["DINEOUT_BOOKING"], required: true },
    state: { type: String, enum: COMMERCE_STATES, required: true, default: "DRAFT" },
    intent: {
      restaurantId: { type: String, required: true, maxlength: 200 },
      restaurantName: { type: String, maxlength: 200 },
      date: { type: String, required: true },
      slotId: { type: Number, required: true },
      itemId: { type: String, required: true, maxlength: 300 },
      reservationTime: { type: Number, required: true },
      guestCount: { type: Number, required: true, min: 1, max: 20 },
      latitude: { type: Number, required: true, min: -90, max: 90 },
      longitude: { type: Number, required: true, min: -180, max: 180 },
    },
    preview: {
      hash: { type: String },
      createdAt: { type: Date },
      expiresAt: { type: Date },
      selectedSlot: { type: mongoose.Schema.Types.Mixed },
    },
    confirmation: {
      idempotencyKeyHash: { type: String },
      confirmedAt: { type: Date },
    },
    submission: {
      attemptedAt: { type: Date },
      completedAt: { type: Date },
      response: { type: mongoose.Schema.Types.Mixed },
      responseHash: { type: String },
      providerExternalReference: { type: String, maxlength: 300 },
    },
    failure: {
      code: { type: String, maxlength: 100 },
      message: { type: String, maxlength: 500 },
      occurredAt: { type: Date },
    },
    nextReconcileAt: { type: Date },
    reconciledAt: { type: Date },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    versionKey: "version",
  },
);

commerceActionSchema.index({ userId: 1, createdAt: -1 });
commerceActionSchema.index({ state: 1, nextReconcileAt: 1 });
commerceActionSchema.index(
  { userId: 1, operation: 1, "confirmation.idempotencyKeyHash": 1 },
  {
    unique: true,
    partialFilterExpression: { "confirmation.idempotencyKeyHash": { $type: "string" } },
  },
);
commerceActionSchema.index(
  { provider: 1, operation: 1, "submission.providerExternalReference": 1 },
  {
    unique: true,
    partialFilterExpression: { "submission.providerExternalReference": { $type: "string" } },
  },
);

const CommerceAction =
  mongoose.models.CommerceAction || mongoose.model("CommerceAction", commerceActionSchema);

export { COMMERCE_STATES, CommerceAction };
