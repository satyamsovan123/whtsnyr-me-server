import { badRequest } from "../errors/app-error.js";
import { MESSAGES } from "../constants/index.js";

function validate(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
      headers: request.headers,
    });

    if (!result.success) {
      console.error('Validation error for', request.originalUrl, result.error.issues);
      return next(
        badRequest(
          "VALIDATION_ERROR",
          MESSAGES.REQUEST_VALIDATION_ERROR,
          result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
            code: issue.code,
          })),
        ),
      );
    }

    request.validated = result.data;
    return next();
  };
}

export { validate };
