import mongoose from "mongoose";

import { PROVIDERS, PROVIDER_CONNECTION_STATUSES } from "../../common/constants/index.js";

const encryptedEnvelopeSchema = new mongoose.Schema(
  {
    algorithm: { type: String, enum: ["A256GCM"], required: true },
    keyVersion: { type: String, required: true },
    iv: { type: String, required: true },
    ciphertext: { type: String, required: true },
    tag: { type: String, required: true },
  },
  { _id: false },
);

const providerConnectionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    provider: { type: String, enum: PROVIDERS, required: true },
    status: {
      type: String,
      enum: PROVIDER_CONNECTION_STATUSES,
      required: true,
      default: "CONNECTED",
      index: true,
    },
    scopes: [{ type: String, maxlength: 80 }],
    tokenEnvelope: { type: encryptedEnvelopeSchema, select: false },
    tokenExpiresAt: { type: Date, required: true, index: true },
    consentedAt: { type: Date, required: true },
    consentVersion: { type: String, default: "swiggy-mcp-v1" },
    lastUsedAt: { type: Date },
    lastErrorAt: { type: Date },
    lastErrorCode: { type: String, maxlength: 80 },
    revokedAt: { type: Date },
  },
  { timestamps: true, optimisticConcurrency: true, versionKey: "version" },
);

providerConnectionSchema.index({ userId: 1, provider: 1 }, { unique: true });
providerConnectionSchema.index({ status: 1, tokenExpiresAt: 1 });

const ProviderConnection =
  mongoose.models.ProviderConnection ||
  mongoose.model("ProviderConnection", providerConnectionSchema);

export { ProviderConnection, encryptedEnvelopeSchema };
