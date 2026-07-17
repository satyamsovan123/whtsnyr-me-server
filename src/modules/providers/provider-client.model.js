import mongoose from "mongoose";

import { PROVIDERS } from "../../common/constants/index.js";

const providerClientSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: PROVIDERS, required: true },
    redirectUri: { type: String, required: true, maxlength: 1000 },
    clientId: { type: String, required: true, maxlength: 500 },
    registeredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

providerClientSchema.index({ provider: 1, redirectUri: 1 }, { unique: true });

const ProviderClient =
  mongoose.models.ProviderClient || mongoose.model("ProviderClient", providerClientSchema);

export { ProviderClient };
