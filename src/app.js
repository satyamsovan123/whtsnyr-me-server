import express from "express";

import { errorHandler } from "./common/middleware/error-handler.js";
import { notFoundHandler } from "./common/middleware/not-found.js";
import { apiRateLimit } from "./common/middleware/rate-limit.js";
import { sendData } from "./common/utils/api-response.js";
import { getConfig } from "./config/env.js";
import { registerSwagger } from "./docs/swagger.js";
import { adminUserRouter, authRouter, meRouter } from "./modules/auth/auth.routes.js";
import { adminCatalogRouter, catalogRouter } from "./modules/catalog/catalog.routes.js";
import { commerceActionRouter } from "./modules/commerce/commerce.routes.js";
import { itineraryRouter } from "./modules/itineraries/itinerary.routes.js";
import { oauthRouter, providerConnectionRouter, swiggyCommerceRouter } from "./modules/providers/swiggy.routes.js";
import { placesRouter } from "./modules/providers/places.routes.js";
import { adminReportRouter, reportRouter } from "./modules/reports/report.routes.js";
import { adminSpecialtyRouter, specialtyRouter } from "./modules/specialties/specialty.routes.js";
import { weatherRouter } from "./modules/weather/weather.routes.js";
import { adminAlertRouter, alertRouter } from "./modules/alerts/alerts.routes.js";
import { insightsRouter } from './modules/insights/insights.routes.js';

const API_PREFIX = "/api/v1";

/**
 * Applies CORS headers for allowed origins and short-circuits preflight requests.
 */
function allowCors(request, response, next) {
  const origin = request.get("origin");
  const { corsOrigins } = getConfig();

  if (origin && corsOrigins.includes(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS");
  }
  if (request.method === "OPTIONS") return response.sendStatus(204);
  return next();
}

/**
 * Creates and configures the Express application with middleware, routes, docs, and handlers.
 */
function createApp() {
  const app = express();
  const config = getConfig();

  app.set("trust proxy", config.trustProxy);
  app.disable("x-powered-by");
  app.use(allowCors);
  app.use(express.json({ limit: "1mb" }));
  registerSwagger(app, API_PREFIX);
  app.use(API_PREFIX, apiRateLimit);

  app.get(`${API_PREFIX}/health`, (_request, response) => sendData(response, { status: "ok" }));
  app.use(`${API_PREFIX}/auth`, authRouter);
  app.use(`${API_PREFIX}/me`, meRouter);
  app.use(`${API_PREFIX}/admin/users`, adminUserRouter);
  app.use(`${API_PREFIX}/catalog`, catalogRouter);
  app.use(`${API_PREFIX}/admin/catalog/specialties`, adminSpecialtyRouter);
  app.use(`${API_PREFIX}/admin/catalog`, adminCatalogRouter);
  app.use(`${API_PREFIX}/specialties`, specialtyRouter);
  app.use(`${API_PREFIX}/itineraries`, itineraryRouter);
  app.use(`${API_PREFIX}/commerce/actions`, commerceActionRouter);
  app.use(`${API_PREFIX}/providers/places`, placesRouter);
  app.use(`${API_PREFIX}/providers`, providerConnectionRouter);
  app.use(`${API_PREFIX}/oauth`, oauthRouter);
  app.use(`${API_PREFIX}/swiggy`, swiggyCommerceRouter);
  app.use(`${API_PREFIX}/reports`, reportRouter);
  app.use(`${API_PREFIX}/admin/reports`, adminReportRouter);
  app.use(`${API_PREFIX}/weather`, weatherRouter);
  app.use(`${API_PREFIX}/alerts`, alertRouter);
  app.use(`${API_PREFIX}/insights`, insightsRouter);
  app.use(`${API_PREFIX}/admin/alerts`, adminAlertRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export { createApp };
