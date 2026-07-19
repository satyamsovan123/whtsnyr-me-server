import mongoose from "mongoose";

import { MESSAGES } from "../constants/index.js";
import { AppError } from "../errors/app-error.js";

function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof mongoose.Error.CastError) {
    return new AppError({
      status: 400,
      code: "INVALID_IDENTIFIER",
      message: process.env.NODE_ENV === "development" ? `CastError: ${error.message}` : MESSAGES.INVALID_RESOURCE_ID,
    });
  }
  if (error instanceof mongoose.Error.ValidationError) {
    return new AppError({
      status: 400,
      code: "MODEL_VALIDATION_ERROR",
      message: MESSAGES.MODEL_VALIDATION_ERROR,
      details: Object.values(error.errors).map((item) => item.message),
    });
  }
  if (error?.code === 11000) {
    return new AppError({
      status: 409,
      code: "DUPLICATE_RESOURCE",
      message: MESSAGES.DUPLICATE_RESOURCE,
    });
  }
  return new AppError({ status: 500, cause: error });
}

function errorHandler(error, request, response, _next) {
  const normalized = normalizeError(error);
  const status = normalized.status || 500;

  request.log?.[status >= 500 ? "error" : "warn"](
    {
      err: error,
      code: normalized.code,
    },
    normalized.message,
  );

  const body = {
    title: normalized.code,
    status,
    detail:
      status >= 500 && process.env.NODE_ENV === "production"
        ? MESSAGES.INTERNAL_ERROR
        : normalized.message,
    instance: request.originalUrl,
    code: normalized.code,
    ...(normalized.details ? { errors: normalized.details } : {}),
  };

  if (response.headersSent) {
    return;
  }
  response.status(status).type("application/problem+json").json(body);
}

export { errorHandler };
