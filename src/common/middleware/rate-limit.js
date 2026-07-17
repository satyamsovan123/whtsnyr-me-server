import { rateLimit } from "express-rate-limit";
import { MESSAGES } from "../constants/index.js";

function problemResponse(code, detail) {
  return (request, response) =>
    response
      .status(429)
      .type("application/problem+json")
      .json({
        type: `https://api.whtsnyr.me/problems/${code.toLowerCase()}`,
        title: code,
        status: 429,
        detail,
        code,
        instance: request.originalUrl,
      });
}

const apiRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 180,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: problemResponse("RATE_LIMITED", MESSAGES.RATE_LIMITED),
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: problemResponse("AUTH_RATE_LIMITED", MESSAGES.AUTH_RATE_LIMITED),
});

const providerRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 40,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: problemResponse("PROVIDER_RATE_LIMITED", MESSAGES.PROVIDER_RATE_LIMITED),
});

export { apiRateLimit, authRateLimit, providerRateLimit };
