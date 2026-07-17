import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getConfig } from "../../config/env.js";
import { MESSAGES } from "../constants/index.js";

function encryptionKey() {
  const config = getConfig();
  if (config.encryption.key) {
    const decoded = Buffer.from(config.encryption.key, "base64");
    if (decoded.length !== 32) {
      throw new Error(MESSAGES.INVALID_ENCRYPTION_KEY);
    }
    return decoded;
  }
  return createHash("sha256").update(`${config.auth.accessSecret}:token-encryption`).digest();
}

function hashSecret(value, pepper = getConfig().auth.accessSecret) {
  return createHash("sha256").update(`${pepper}:${value}`).digest("hex");
}

function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

function encryptSecret(plaintext, additionalAuthenticatedData) {
  const config = getConfig();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(additionalAuthenticatedData));
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

  return {
    algorithm: "A256GCM",
    keyVersion: config.encryption.keyVersion,
    iv: iv.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptSecret(envelope, additionalAuthenticatedData) {
  if (!envelope || envelope.algorithm !== "A256GCM") {
    throw new Error(MESSAGES.INVALID_ENCRYPTED_SECRET);
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAAD(Buffer.from(additionalAuthenticatedData));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

export { hashSecret, randomToken, encryptSecret, decryptSecret };
