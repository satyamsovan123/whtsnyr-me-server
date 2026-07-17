const MESSAGES = Object.freeze({
  INTERNAL_ERROR: "An unexpected server error occurred",
  AUTHENTICATION_REQUIRED: "Authentication is required",
  ACCESS_FORBIDDEN: "You do not have permission to perform this action",
  INVALID_RESOURCE_ID: "Invalid resource id",
  MODEL_VALIDATION_ERROR: "The resource failed validation",
  DUPLICATE_RESOURCE: "A resource with these unique values already exists",
  REQUEST_VALIDATION_ERROR: "The request did not pass validation",
  INVALID_ACCESS_TOKEN: "The access token is invalid or expired",
  EXPIRED_ACCESS_TOKEN: "The access token is no longer valid",
  INVALID_CREDENTIALS: "Invalid email or password",
  EMAIL_ALREADY_REGISTERED: "An account with this email already exists",
  VERSION_CONFLICT: "The resource changed; reload it before updating",
  ITINERARY_UNAVAILABLE: "Itinerary changed or is archived",
  ACTION_NOT_EDITABLE: "Action changed or is no longer a draft",
  ACTION_NOT_PREVIEWABLE: "Action changed or cannot be previewed",
  SLOT_NOT_AVAILABLE: "The selected free reservation slot is no longer available",
  SWIGGY_WRITES_DISABLED: "Swiggy booking writes are disabled in this environment",
  RESOURCE_NOT_FOUND: (resource) => `${resource} was not found`,
  ROUTE_NOT_FOUND: (method, url) => `No route matches ${method} ${url}`,
  RATE_LIMITED: "Too many requests; retry shortly",
  AUTH_RATE_LIMITED: "Too many authentication attempts",
  PROVIDER_RATE_LIMITED: "Too many provider requests",
  INVALID_CONFIGURATION: (details) => `Invalid environment configuration: ${details}`,
  INVALID_CORS_ORIGIN: "CORS origin must be an exact origin without a path",
  INVALID_ENCRYPTION_KEY: "TOKEN_ENCRYPTION_KEY must be exactly 32 bytes encoded as base64",
  INVALID_ENCRYPTED_SECRET: "Unsupported or missing encrypted secret envelope",
});

const USER_ROLES = Object.freeze(["VISITOR", "CURATOR", "ADMIN"]);
const USER_STATUSES = Object.freeze(["ACTIVE", "SUSPENDED", "DISABLED"]);
const MOBILITY_OPTIONS = Object.freeze(["STANDARD", "LOW_WALKING", "WHEELCHAIR_ACCESSIBLE"]);

const CATALOG_STATUSES = Object.freeze(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const PLACE_TYPES = Object.freeze([
  "MUSEUM",
  "PARK",
  "HERITAGE",
  "LANDMARK",
  "MARKET",
  "VIEWPOINT",
  "WORKSHOP",
  "RELIGIOUS_SITE",
  "ENTERTAINMENT",
  "FACILITY",
  "LOCAL_SHOPPING",
  "OTHER",
]);
const PRICE_BANDS = Object.freeze(["FREE", "BUDGET", "MODERATE", "PREMIUM"]);
const SOURCE_TYPES = Object.freeze(["OFFICIAL", "CURATOR", "MERCHANT", "OPEN_DATA", "OTHER"]);
const FULFILLMENT_MODES = Object.freeze([
  "PICKUP",
  "LOCAL_DELIVERY",
  "NATIONAL_SHIPPING",
  "CONTACT_ONLY",
]);
const MERCHANT_VERIFICATION_STATUSES = Object.freeze(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]);

const REPORT_REASONS = Object.freeze([
  "INCORRECT_INFO",
  "CLOSED",
  "SAFETY",
  "DUPLICATE",
  "INAPPROPRIATE",
  "OTHER",
]);
const REPORT_STATUSES = Object.freeze(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]);
const ITINERARY_STATUSES = Object.freeze(["DRAFT", "SAVED", "ARCHIVED"]);
const COMMERCE_STATES = Object.freeze([
  "DRAFT",
  "PREVIEWED",
  "SUBMITTING",
  "SUBMITTED",
  "RECONCILED",
  "RECONCILIATION_REQUIRED",
  "FAILED",
  "EXPIRED",
  "CANCELLED",
]);
const PROVIDERS = Object.freeze(["SWIGGY"]);
const PROVIDER_CONNECTION_STATUSES = Object.freeze(["CONNECTED", "EXPIRED", "REVOKED", "ERROR"]);
const COMMERCE_OPERATIONS = Object.freeze(["DINEOUT_BOOKING"]);

export {
  MESSAGES,
  USER_ROLES,
  USER_STATUSES,
  MOBILITY_OPTIONS,
  CATALOG_STATUSES,
  PLACE_TYPES,
  PRICE_BANDS,
  SOURCE_TYPES,
  FULFILLMENT_MODES,
  MERCHANT_VERIFICATION_STATUSES,
  REPORT_REASONS,
  REPORT_STATUSES,
  ITINERARY_STATUSES,
  COMMERCE_STATES,
  PROVIDERS,
  PROVIDER_CONNECTION_STATUSES,
  COMMERCE_OPERATIONS,
});