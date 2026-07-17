import pino from "pino";
import { createWriteStream, mkdirSync } from "node:fs";
import { dirname } from "node:path";

import { getConfig } from "./env.js";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "res.headers.set-cookie",
  "password",
  "accessToken",
  "refreshToken",
  "tokenEnvelope",
  "codeVerifier",
];

function createLogger() {
  const config = getConfig();
  const logPath = config.logFilePath;
  mkdirSync(dirname(logPath), { recursive: true });
  const fileStream = createWriteStream(logPath, { flags: "a" });

  const teeStream = {
    write(chunk) {
      process.stdout.write(chunk);
      fileStream.write(chunk);
      return true;
    },
  };

  return pino({
    level: process.env.LOG_LEVEL || (config.env === "test" ? "silent" : "info"),
    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },
    base: {
      service: "whtsnyr-me-server",
      environment: config.env,
    },
  }, teeStream);
}

export { createLogger };
