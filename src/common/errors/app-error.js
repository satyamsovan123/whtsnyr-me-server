import { MESSAGES } from "../constants/index.js";

class AppError extends Error {
  constructor({ status = 500, code = "INTERNAL_ERROR", message, details, cause } = {}) {
    super(message || MESSAGES.INTERNAL_ERROR, { cause });
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = status < 500;
  }
}

function badRequest(code, message, details) {
  return new AppError({ status: 400, code, message, details });
}

function unauthorized(message = MESSAGES.AUTHENTICATION_REQUIRED) {
  return new AppError({ status: 401, code: "UNAUTHORIZED", message });
}

function forbidden(message = MESSAGES.ACCESS_FORBIDDEN) {
  return new AppError({ status: 403, code: "FORBIDDEN", message });
}

function notFound(resource = "Resource") {
  return new AppError({ status: 404, code: "NOT_FOUND", message: MESSAGES.RESOURCE_NOT_FOUND(resource) });
}

function conflict(code, message) {
  return new AppError({ status: 409, code, message });
}

export { AppError, badRequest, unauthorized, forbidden, notFound, conflict };
