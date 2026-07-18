import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { z } from "zod";

const booleanFromString = z.enum(["true", "false"]).transform((value) => value === "true");

const rawSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    MONGO_URI: z.string().min(1, "MONGO_URI is required"),
    CORS_ORIGINS: z.string().default("http://localhost:4200,https://whtsnyr-me.web.app"),
    FRONTEND_URL: z.string().url().default("https://whtsnyr-me.web.app"),
    TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
    LOG_FILE_PATH: z.string().default("logs/app.log"),
    JWT_ACCESS_SECRET: z.string().optional(),
    TOKEN_ENCRYPTION_KEY: z.string().optional(),
    TOKEN_ENCRYPTION_KEY_VERSION: z.string().default("v1"),
    ACCESS_TOKEN_TTL: z.string().default("15m"),
    API_BASE_URL: z.string().url().default("https://whtsnyr-me-server.onrender.com/api/v1"),
    SWIGGY_BASE_URL: z.string().url().default("https://mcp.swiggy.com"),
    SWIGGY_MCP_BASE_URL: z.string().url().default("https://mcp.swiggy.com"),
    SWIGGY_OAUTH_REDIRECT_URI: z.string().url().optional(),
    SWIGGY_CLIENT_ID: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),
    LLM_1_API_KEY: z.string().optional(),
    LLM_1_MODEL: z.string().optional(),
    SWIGGY_DYNAMIC_CLIENT_REGISTRATION_ENABLED: booleanFromString.optional(),
    SWIGGY_WRITES_ENABLED: booleanFromString.default(false),
    SWIGGY_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).default(10000),
    GEOCODING_ENABLED: booleanFromString.default(true),
    GEOCODER_BASE_URL: z.string().url().default("https://nominatim.openstreetmap.org"),
    GEOCODER_USER_AGENT: z.string().min(5).default("whtsnyr-me/1.0 (local-development)"),
    WEATHER_CACHE_TTL_MS: z.coerce.number().int().min(0).default(1_800_000),
    ALERTS_RSS_CACHE_TTL_MS: z.coerce.number().int().min(0).default(900_000),
    GOOGLE_MAPS_API_KEY: z.string().optional(),
  })
  .passthrough();

function developmentSecret(label) {
  return createHash("sha256").update(`whtsnyr-local-only:${label}`).digest("hex");
}

function parseOrigins(value) {
  const origins = value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  for (const origin of origins) {
    const parsed = new URL(origin);
    if (parsed.origin !== origin || parsed.pathname !== "/") {
      throw new Error(`CORS origin must be an exact origin without a path: ${origin}`);
    }
  }

  return origins;
}

let envFilesLoaded = false;

function loadEnvFilesIfAvailable() {
  if (envFilesLoaded) {
    return;
  }
  envFilesLoaded = true;

  if (typeof process.loadEnvFile !== "function") {
    return;
  }

  for (const fileName of [".env.local", ".env"]) {
    const filePath = resolve(process.cwd(), fileName);
    if (existsSync(filePath)) {
      process.loadEnvFile(filePath);
    }
  }
}

function loadConfig(source = process.env) {
  if (source === process.env) {
    loadEnvFilesIfAvailable();
  }

  const parsed = rawSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    const missingMongoUri = parsed.error.issues.some(
      (issue) => issue.path.join(".") === "MONGO_URI" && issue.code === "invalid_type",
    );

    if (missingMongoUri) {
      throw new Error(
        `Invalid environment configuration: ${details.join("; ")}. Add MONGO_URI to your shell environment or create a .env file from .env.example.`,
      );
    }

    throw new Error(`Invalid environment configuration: ${details.join("; ")}`);
  }

  const raw = parsed.data;
  const isProduction = raw.NODE_ENV === "production";
  const accessSecret = raw.JWT_ACCESS_SECRET || developmentSecret("access-token");
  const encryptionKey =
    raw.TOKEN_ENCRYPTION_KEY ||
    (isProduction ? undefined : createHash("sha256").update("whtsnyr-local-only:encryption").digest("base64"));
  const apiBaseUrl = raw.API_BASE_URL.replace(/\/$/, "");

  if (isProduction && (!raw.JWT_ACCESS_SECRET || raw.JWT_ACCESS_SECRET.length < 32)) {
    throw new Error("JWT_ACCESS_SECRET must contain at least 32 characters in production");
  }
  if (isProduction && !raw.TOKEN_ENCRYPTION_KEY) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required in production");
  }

  return Object.freeze({
    env: raw.NODE_ENV,
    isProduction,
    port: raw.PORT,
    mongoUri: raw.MONGO_URI,
    corsOrigins: parseOrigins(raw.CORS_ORIGINS),
    frontendUrl: raw.FRONTEND_URL,
    apiBaseUrl,
    trustProxy: raw.TRUST_PROXY,
    logFilePath: raw.LOG_FILE_PATH,
    auth: {
      accessSecret,
      accessTokenTtl: raw.ACCESS_TOKEN_TTL,
    },
    encryption: {
      key: encryptionKey,
      keyVersion: raw.TOKEN_ENCRYPTION_KEY_VERSION,
    },
    swiggy: {
      baseUrl: raw.SWIGGY_BASE_URL.replace(/\/$/, ""),
      mcpBaseUrl: raw.SWIGGY_MCP_BASE_URL.replace(/\/$/, ""),
      redirectUri: raw.SWIGGY_OAUTH_REDIRECT_URI || `${apiBaseUrl}/oauth/swiggy/callback`,
      clientId: raw.SWIGGY_CLIENT_ID,
      dcrEnabled: raw.SWIGGY_DYNAMIC_CLIENT_REGISTRATION_ENABLED ?? raw.NODE_ENV !== "production",
      writesEnabled: raw.SWIGGY_WRITES_ENABLED,
      timeoutMs: raw.SWIGGY_REQUEST_TIMEOUT_MS,
    },
    geocoding: {
      enabled: raw.GEOCODING_ENABLED,
      baseUrl: raw.GEOCODER_BASE_URL.replace(/\/$/, ""),
      userAgent: raw.GEOCODER_USER_AGENT,
    },
    googleMaps: {
      apiKey: raw.GOOGLE_MAPS_API_KEY || "",
    },
    GEMINI_API_KEY: raw.GEMINI_API_KEY || raw.LLM_1_API_KEY,
    GEMINI_MODEL: raw.LLM_1_MODEL || "gemini-1.5-flash",
    weather: {
      cacheTtlMs: raw.WEATHER_CACHE_TTL_MS,
    },
    alerts: {
      rssCacheTtlMs: raw.ALERTS_RSS_CACHE_TTL_MS,
    },
  });
}

let cachedConfig;

function getConfig() {
  cachedConfig ||= loadConfig();
  return cachedConfig;
}

function resetConfigForTests() {
  cachedConfig = undefined;
  envFilesLoaded = false;
}

export { loadConfig, getConfig, resetConfigForTests };
