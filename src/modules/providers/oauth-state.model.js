import mongoose from "mongoose";

import { PROVIDERS } from "../../common/constants/index.js";
import { encryptedEnvelopeSchema } from "./provider-connection.model.js";

const oauthStateSchema = new mongoose.Schema(
  {
    stateHash: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    provider: { type: String, enum: PROVIDERS, required: true },
    clientId: { type: String, required: true, maxlength: 500 },
    redirectUri: { type: String, required: true, maxlength: 1000 },
    verifierEnvelope: { type: encryptedEnvelopeSchema, required: true, select: false },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
  },
  { timestamps: true },
);

oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OAuthState = mongoose.models.OAuthState || mongoose.model("OAuthState", oauthStateSchema);

export { OAuthState };
