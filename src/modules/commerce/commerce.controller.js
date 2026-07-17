import { sendData } from "../../common/utils/api-response.js";
import {
  cancelCommerceAction,
  confirmCommerceAction,
  createCommerceAction,
  getCommerceAction,
  listCommerceActions,
  previewCommerceAction,
  updateCommerceAction,
} from "./commerce.service.js";

/** Creates a new commerce action intent for the authenticated user. */
async function createAction(request, response) {
  return sendData(
    response,
    await createCommerceAction(request.auth.userId, request.validated.body),
    { status: 201 },
  );
}

/** Updates mutable fields for an existing commerce action. */
async function updateAction(request, response) {
  return sendData(
    response,
    await updateCommerceAction(
      request.auth.userId,
      request.validated.params.id,
      request.validated.body,
    ),
  );
}

/** Executes preview flow for a commerce action. */
async function previewAction(request, response) {
  return sendData(
    response,
    await previewCommerceAction(
      request.auth.userId,
      request.validated.params.id,
      request.validated.body.expectedVersion,
    ),
  );
}

/** Confirms a commerce action with idempotency guarantees. */
async function confirmAction(request, response) {
  return sendData(
    response,
    await confirmCommerceAction(
      request.auth.userId,
      request.validated.params.id,
      request.validated.body,
      request.validated.headers["idempotency-key"],
    ),
    { status: 202 },
  );
}

/** Cancels a commerce action. */
async function cancelAction(request, response) {
  return sendData(
    response,
    await cancelCommerceAction(
      request.auth.userId,
      request.validated.params.id,
      request.validated.body.expectedVersion,
    ),
  );
}

/** Lists commerce actions with pagination for the authenticated user. */
async function listActions(request, response) {
  const result = await listCommerceActions(request.auth.userId, request.validated.query);
  return sendData(response, result.documents, { meta: result.meta });
}

/** Returns one commerce action by id for the authenticated user. */
async function getAction(request, response) {
  return sendData(
    response,
    await getCommerceAction(request.auth.userId, request.validated.params.id),
  );
}

export {
  createAction,
  updateAction,
  previewAction,
  confirmAction,
  cancelAction,
  listActions,
  getAction,
};
