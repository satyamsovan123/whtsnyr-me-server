import { createHash, randomBytes } from "node:crypto";

import { AppError, conflict, unauthorized } from "../../common/errors/app-error.js";
import {
  decryptSecret,
  encryptSecret,
  hashSecret,
  randomToken,
} from "../../common/security/crypto.js";
import { getConfig } from "../../config/env.js";
import { OAuthState } from "./oauth-state.model.js";
import { ProviderClient } from "./provider-client.model.js";
import { ProviderConnection } from "./provider-connection.model.js";

function oauthStateAad(userId, stateHash) {
  return `${userId}|SWIGGY|OAUTH_STATE|${stateHash}`;
}

function tokenAad(userId) {
  return `${userId}|SWIGGY|ACCESS_TOKEN`;
}

async function fetchJson(url, options, code) {
  const config = getConfig();
  let response;
  try {
    response = await fetch(url, {
      ...options,
      redirect: "error",
      signal: AbortSignal.timeout(config.swiggy.timeoutMs),
    });
  } catch (error) {
    throw new AppError({
      status: 502,
      code,
      message: "Swiggy authorization is temporarily unavailable",
      cause: error,
    });
  }

  const text = await response.text();
  if (text.length > 500_000) {
    throw new AppError({
      status: 502,
      code: "SWIGGY_AUTH_RESPONSE_TOO_LARGE",
      message: "Swiggy returned an oversized authorization response",
    });
  }

  let payload = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch (error) {
    throw new AppError({
      status: 502,
      code: "SWIGGY_AUTH_INVALID_RESPONSE",
      message: "Swiggy returned malformed authorization data",
      cause: error,
    });
  }

  if (!response.ok) {
    throw new AppError({
      status: response.status >= 500 ? 502 : 400,
      code,
      message: payload.error_description || payload.error || "Swiggy authorization failed",
    });
  }
  return payload;
}

async function getClientId() {
  const config = getConfig();
  if (config.swiggy.clientId) return config.swiggy.clientId;

  const existing = await ProviderClient.findOne({
    provider: "SWIGGY",
    redirectUri: config.swiggy.redirectUri,
  }).lean();
  if (existing) return existing.clientId;
  if (!config.swiggy.dcrEnabled) {
    throw new AppError({
      status: 503,
      code: "SWIGGY_CLIENT_NOT_CONFIGURED",
      message: "Set SWIGGY_CLIENT_ID after enterprise onboarding",
    });
  }

  const registration = await fetchJson(
    `${config.swiggy.baseUrl}/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_name: "whtsnyr.me visitor copilot",
        redirect_uris: [config.swiggy.redirectUri],
        grant_types: ["authorization_code"],
        response_types: ["code"],
        token_endpoint_auth_method: "none",
      }),
    },
    "SWIGGY_CLIENT_REGISTRATION_FAILED",
  );
  if (!registration.client_id || typeof registration.client_id !== "string") {
    throw new AppError({
      status: 502,
      code: "SWIGGY_CLIENT_REGISTRATION_INVALID",
      message: "Swiggy dynamic client registration returned no client id",
    });
  }

  try {
    await ProviderClient.create({
      provider: "SWIGGY",
      redirectUri: config.swiggy.redirectUri,
      clientId: registration.client_id,
    });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }
  return registration.client_id;
}

async function beginSwiggyAuthorization(userId) {
  const config = getConfig();
  const clientId = await getClientId();
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  const state = randomToken(32);
  const stateHash = hashSecret(state);
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  await OAuthState.create({
    stateHash,
    userId,
    provider: "SWIGGY",
    clientId,
    redirectUri: config.swiggy.redirectUri,
    verifierEnvelope: encryptSecret(codeVerifier, oauthStateAad(userId, stateHash)),
    expiresAt,
  });

  const authorizationUrl = new URL(`${config.swiggy.baseUrl}/auth/authorize`);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("redirect_uri", config.swiggy.redirectUri);
  authorizationUrl.searchParams.set("code_challenge", codeChallenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("scope", "mcp:tools");

  return { authorizationUrl: authorizationUrl.toString(), expiresAt };
}

async function claimState(rawState) {
  if (!rawState) throw unauthorized("OAuth state is missing");
  const stateHash = hashSecret(rawState);
  const state = await OAuthState.findOneAndUpdate(
    { stateHash, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
    { new: true },
  ).select("+verifierEnvelope");
  if (!state) throw unauthorized("OAuth state is invalid, expired, or already used");
  return state;
}

async function failSwiggyAuthorization(rawState) {
  await claimState(rawState);
}

async function completeSwiggyAuthorization({ code, state: rawState }) {
  const config = getConfig();
  const state = await claimState(rawState);
  const userId = String(state.userId);
  const codeVerifier = decryptSecret(
    state.verifierEnvelope,
    oauthStateAad(userId, state.stateHash),
  );
  const token = await fetchJson(
    `${config.swiggy.baseUrl}/auth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        code_verifier: codeVerifier,
        client_id: state.clientId,
        redirect_uri: state.redirectUri,
      }),
    },
    "SWIGGY_TOKEN_EXCHANGE_FAILED",
  );
  if (!token.access_token || typeof token.access_token !== "string") {
    throw new AppError({
      status: 502,
      code: "SWIGGY_TOKEN_RESPONSE_INVALID",
      message: "Swiggy returned no access token",
    });
  }

  const expiresIn = Math.min(Math.max(Number(token.expires_in) || 432_000, 60), 432_000);
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
  await ProviderConnection.findOneAndUpdate(
    { userId: state.userId, provider: "SWIGGY" },
    {
      $set: {
        status: "CONNECTED",
        scopes: String(token.scope || "mcp:tools")
          .split(/\s+/)
          .filter(Boolean),
        tokenEnvelope: encryptSecret(token.access_token, tokenAad(userId)),
        tokenExpiresAt,
        consentedAt: new Date(),
        revokedAt: null,
        lastErrorAt: null,
        lastErrorCode: null,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  return { userId, tokenExpiresAt };
}

async function getSwiggyConnection(userId) {
  const connection = await ProviderConnection.findOne({ userId, provider: "SWIGGY" }).lean();
  if (!connection) return { provider: "SWIGGY", status: "NOT_CONNECTED" };
  return {
    provider: connection.provider,
    status:
      connection.status === "CONNECTED" && connection.tokenExpiresAt <= new Date()
        ? "EXPIRED"
        : connection.status,
    scopes: connection.scopes,
    tokenExpiresAt: connection.tokenExpiresAt,
    consentedAt: connection.consentedAt,
    lastUsedAt: connection.lastUsedAt,
  };
}

async function getSwiggyAccessToken(userId) {
  const connection = await ProviderConnection.findOne({
    userId,
    provider: "SWIGGY",
    status: "CONNECTED",
    tokenExpiresAt: { $gt: new Date(Date.now() + 60_000) },
  }).select("+tokenEnvelope +tokenEnvelope.iv +tokenEnvelope.ciphertext +tokenEnvelope.tag");
  if (!connection?.tokenEnvelope) {
    throw conflict("SWIGGY_REAUTH_REQUIRED", "Connect or re-authorize your Swiggy account");
  }
  return {
    connection,
    accessToken: decryptSecret(connection.tokenEnvelope, tokenAad(userId)),
  };
}

async function disconnectSwiggy(userId) {
  const config = getConfig();
  let remoteRevoked = false;
  try {
    const { accessToken } = await getSwiggyAccessToken(userId);
    const response = await fetch(`${config.swiggy.baseUrl}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "error",
      signal: AbortSignal.timeout(config.swiggy.timeoutMs),
    });
    remoteRevoked = response.ok;
  } catch {
    remoteRevoked = false;
  }

  await ProviderConnection.updateOne(
    { userId, provider: "SWIGGY" },
    {
      $set: { status: "REVOKED", revokedAt: new Date() },
      $unset: { tokenEnvelope: 1 },
    },
  );
  return { provider: "SWIGGY", status: "REVOKED", remoteRevoked };
}

export {
  beginSwiggyAuthorization,
  failSwiggyAuthorization,
  completeSwiggyAuthorization,
  getSwiggyConnection,
  getSwiggyAccessToken,
  disconnectSwiggy,
};
