import { AppError } from "../errors/app-error.js";
import { MESSAGES } from "../constants/index.js";

function notFoundHandler(request, _response, next) {
  next(
    new AppError({
      status: 404,
      code: "ROUTE_NOT_FOUND",
      message: MESSAGES.ROUTE_NOT_FOUND(request.method, request.originalUrl),
    }),
  );
}

export { notFoundHandler };
