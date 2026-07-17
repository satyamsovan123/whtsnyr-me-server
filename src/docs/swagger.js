import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

import { getConfig } from "../config/env.js";

const secured = [{ bearerAuth: [] }];

function buildOpenApiSpec(apiPrefix) {
  const { apiBaseUrl } = getConfig();

  return swaggerJsdoc({
    definition: {
      openapi: "3.0.3",
      info: {
        title: "whtsnyr.me Server API",
        version: "1.0.0",
        description:
          "HTTP API for auth, discovery catalog, itineraries, commerce, provider integrations, and moderation.",
      },
      servers: [{ url: apiBaseUrl }],
      tags: [
        { name: "Health" },
        { name: "Auth" },
        { name: "Me" },
        { name: "Admin Users" },
        { name: "Catalog" },
        { name: "Admin Catalog" },
        { name: "Itineraries" },
        { name: "Commerce" },
        { name: "Providers" },
        { name: "OAuth" },
        { name: "Swiggy Commerce" },
        { name: "Reports" },
        { name: "Admin Reports" },
        { name: "Specialties" },
        { name: "Admin Specialties" },
        { name: "Weather" },
        { name: "Alerts" },
        { name: "Admin Alerts" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
        schemas: {
          ApiEnvelope: {
            type: "object",
            properties: {
              success: { type: "boolean", example: true },
              data: { type: "object", additionalProperties: true },
              meta: { type: "object", additionalProperties: true },
            },
            required: ["success", "data"],
          },
          Problem: {
            type: "object",
            properties: {
              title: { type: "string" },
              status: { type: "integer" },
              detail: { type: "string" },
              code: { type: "string" },
              instance: { type: "string" },
              errors: { type: "array", items: { type: "object", additionalProperties: true } },
            },
            required: ["title", "status", "detail", "code", "instance"],
          },
        },
        responses: {
          Success: {
            description: "Successful response",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiEnvelope" },
              },
            },
          },
          Problem: {
            description: "Problem details response",
            content: {
              "application/problem+json": {
                schema: { $ref: "#/components/schemas/Problem" },
              },
            },
          },
        },
      },
      paths: {
        [`${apiPrefix}/health`]: {
          get: {
            tags: ["Health"],
            summary: "Service health check",
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/auth/register`]: {
          post: {
            tags: ["Auth"],
            summary: "Register a user account",
            responses: {
              201: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
              429: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/auth/login`]: {
          post: {
            tags: ["Auth"],
            summary: "Login with email and password",
            responses: {
              200: { $ref: "#/components/responses/Success" },
              401: { $ref: "#/components/responses/Problem" },
              429: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/me`]: {
          get: {
            tags: ["Me"],
            summary: "Get current user profile",
            security: secured,
            responses: {
              200: { $ref: "#/components/responses/Success" },
              401: { $ref: "#/components/responses/Problem" },
            },
          },
          patch: {
            tags: ["Me"],
            summary: "Update current user profile",
            security: secured,
            responses: {
              200: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
              401: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/users`]: {
          get: {
            tags: ["Admin Users"],
            summary: "List users",
            security: secured,
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/users/{id}/status`]: {
          patch: {
            tags: ["Admin Users"],
            summary: "Update user status",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/users/{id}/roles`]: {
          put: {
            tags: ["Admin Users"],
            summary: "Update user roles",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/catalog/areas/resolve`]: {
          post: {
            tags: ["Catalog"],
            summary: "Resolve an area by query or coordinates",
            responses: {
              200: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/catalog/{resource}`]: {
          get: {
            tags: ["Catalog"],
            summary: "List published catalog resources",
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/catalog/{resource}/{id}`]: {
          get: {
            tags: ["Catalog"],
            summary: "Get a published catalog resource",
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/catalog/{resource}`]: {
          get: {
            tags: ["Admin Catalog"],
            summary: "List catalog resources for curation",
            security: secured,
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
            },
          },
          post: {
            tags: ["Admin Catalog"],
            summary: "Create a catalog resource",
            security: secured,
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
            ],
            responses: {
              201: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/catalog/{resource}/{id}`]: {
          get: {
            tags: ["Admin Catalog"],
            summary: "Get a catalog resource for curation",
            security: secured,
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
          patch: {
            tags: ["Admin Catalog"],
            summary: "Update a catalog resource",
            security: secured,
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/catalog/{resource}/{id}/publish`]: {
          post: {
            tags: ["Admin Catalog"],
            summary: "Publish a catalog resource",
            security: secured,
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/catalog/{resource}/{id}/archive`]: {
          post: {
            tags: ["Admin Catalog"],
            summary: "Archive a catalog resource",
            security: secured,
            parameters: [
              {
                name: "resource",
                in: "path",
                required: true,
                schema: { type: "string", enum: ["areas", "places", "events", "merchants"] },
              },
              { name: "id", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/itineraries/plan`]: {
          post: {
            tags: ["Itineraries"],
            summary: "Plan an itinerary",
            security: secured,
            responses: {
              201: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/itineraries`]: {
          get: {
            tags: ["Itineraries"],
            summary: "List user itineraries",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/itineraries/{id}`]: {
          get: {
            tags: ["Itineraries"],
            summary: "Get itinerary",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
          patch: {
            tags: ["Itineraries"],
            summary: "Update itinerary",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/itineraries/{id}/replan`]: {
          post: {
            tags: ["Itineraries"],
            summary: "Replan itinerary",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/itineraries/{id}/save`]: {
          post: {
            tags: ["Itineraries"],
            summary: "Mark itinerary as saved",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/itineraries/{id}/archive`]: {
          post: {
            tags: ["Itineraries"],
            summary: "Archive itinerary",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/commerce/actions`]: {
          post: {
            tags: ["Commerce"],
            summary: "Create commerce action",
            security: secured,
            responses: {
              201: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
            },
          },
          get: {
            tags: ["Commerce"],
            summary: "List commerce actions",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/commerce/actions/{id}`]: {
          get: {
            tags: ["Commerce"],
            summary: "Get commerce action",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
          patch: {
            tags: ["Commerce"],
            summary: "Update commerce action",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/commerce/actions/{id}/preview`]: {
          post: {
            tags: ["Commerce"],
            summary: "Preview commerce action",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/commerce/actions/{id}/confirm`]: {
          post: {
            tags: ["Commerce"],
            summary: "Confirm commerce action",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              202: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/commerce/actions/{id}/cancel`]: {
          post: {
            tags: ["Commerce"],
            summary: "Cancel commerce action",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/providers`]: {
          get: {
            tags: ["Providers"],
            summary: "List provider connections",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/providers/swiggy`]: {
          get: {
            tags: ["Providers"],
            summary: "Get Swiggy connection status",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
          delete: {
            tags: ["Providers"],
            summary: "Disconnect Swiggy",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/providers/swiggy/authorize`]: {
          post: {
            tags: ["Providers"],
            summary: "Begin Swiggy OAuth authorization",
            security: secured,
            responses: {
              201: { $ref: "#/components/responses/Success" },
              429: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/providers/places/nearby`]: {
          get: {
            tags: ["Providers"],
            summary: "Get dynamic nearby places from Google Maps",
            security: secured,
            parameters: [
              { name: "latitude", in: "query", required: true, schema: { type: "number" } },
              { name: "longitude", in: "query", required: true, schema: { type: "number" } },
              { name: "type", in: "query", required: false, schema: { type: "string", default: "tourist_attraction" } },
              { name: "radius", in: "query", required: false, schema: { type: "number", default: 1500 } },
            ],
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/oauth/swiggy/callback`]: {
          get: {
            tags: ["OAuth"],
            summary: "Swiggy OAuth callback endpoint",
            responses: {
              302: { description: "Redirects to frontend integration status page" },
              400: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/swiggy/addresses`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "List Swiggy addresses",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/food/restaurants`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Search Swiggy restaurants",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/food/dishes`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Search Swiggy dishes",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/food/restaurants/{restaurantId}/menu`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Get restaurant menu",
            security: secured,
            parameters: [
              { name: "restaurantId", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/instamart/products`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Search Instamart products",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/dineout/restaurants`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Search Dineout restaurants",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/dineout/restaurants/{restaurantId}`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Get Dineout restaurant details",
            security: secured,
            parameters: [
              { name: "restaurantId", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/swiggy/dineout/restaurants/{restaurantId}/slots`]: {
          get: {
            tags: ["Swiggy Commerce"],
            summary: "Get Dineout booking slots",
            security: secured,
            parameters: [
              { name: "restaurantId", in: "path", required: true, schema: { type: "string" } },
            ],
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/reports`]: {
          post: {
            tags: ["Reports"],
            summary: "Create content report",
            security: secured,
            responses: {
              201: { $ref: "#/components/responses/Success" },
              400: { $ref: "#/components/responses/Problem" },
            },
          },
          get: {
            tags: ["Reports"],
            summary: "List own reports",
            security: secured,
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/reports/{id}`]: {
          get: {
            tags: ["Reports"],
            summary: "Get own report",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              404: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/reports`]: {
          get: {
            tags: ["Admin Reports"],
            summary: "List all reports",
            security: secured,
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/admin/reports/{id}`]: {
          patch: {
            tags: ["Admin Reports"],
            summary: "Update report",
            security: secured,
            parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
            responses: {
              200: { $ref: "#/components/responses/Success" },
              403: { $ref: "#/components/responses/Problem" },
              409: { $ref: "#/components/responses/Problem" },
            },
          },
        },
        [`${apiPrefix}/specialties`]: {
          get: {
            tags: ["Specialties"],
            summary: "List published specialties",
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/weather`]: {
          get: {
            tags: ["Weather"],
            summary: "Get current weather for coordinates",
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
        [`${apiPrefix}/alerts`]: {
          get: {
            tags: ["Alerts"],
            summary: "Get active alerts",
            responses: { 200: { $ref: "#/components/responses/Success" } },
          },
        },
      },
    },
    apis: [],
  });
}

/**
 * Registers OpenAPI JSON and Swagger UI routes.
 */
function registerSwagger(app, apiPrefix) {
  const spec = buildOpenApiSpec(apiPrefix);
  app.get(`${apiPrefix}/openapi.json`, (_request, response) => response.json(spec));
  app.use(
    `${apiPrefix}/docs`,
    swaggerUi.serve,
    swaggerUi.setup(spec, {
      explorer: true,
      customSiteTitle: "whtsnyr.me API Docs",
    }),
  );
}

export { registerSwagger };
