import { AppError, badRequest, conflict, notFound } from "../../common/errors/app-error.js";
import { hashSecret } from "../../common/security/crypto.js";
import { hashObject } from "../../common/utils/canonical-json.js";
import { getConfig } from "../../config/env.js";
import {
  callSwiggyDineoutBooking,
  callSwiggyReadTool,
  SwiggyToolRejectedError,
  SwiggyWriteAmbiguousError,
} from "../providers/swiggy-mcp.service.js";
import { CommerceAction } from "./commerce-action.model.js";

function selectedSlotFromResponse(value, intent, context = {}, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);
  const inherited = {
    reservationTime: value.reservationTime ?? context.reservationTime,
    dateStr: value.dateStr ?? context.dateStr,
    displayTime: value.displayTime ?? context.displayTime,
  };

  if (
    Number(value.slotId) === intent.slotId &&
    String(value.itemId || "") === intent.itemId &&
    Number(inherited.reservationTime) === intent.reservationTime
  ) {
    return {
      slotId: intent.slotId,
      itemId: intent.itemId,
      reservationTime: intent.reservationTime,
      dateStr: inherited.dateStr,
      displayTime: inherited.displayTime,
      title: typeof value.title === "string" ? value.title.slice(0, 200) : undefined,
      isFree: value.isFree === true,
      bookingPrice: Number(value.bookingPrice || 0),
    };
  }

  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    const match = selectedSlotFromResponse(child, intent, inherited, seen);
    if (match) return match;
  }
  return undefined;
}

function findExternalReference(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return undefined;
  seen.add(value);
  for (const key of ["orderId", "bookingId", "order_id", "booking_id"]) {
    if (typeof value[key] === "string" || typeof value[key] === "number") {
      return String(value[key]);
    }
  }
  for (const child of Array.isArray(value) ? value : Object.values(value)) {
    const found = findExternalReference(child, seen);
    if (found) return found;
  }
  return undefined;
}

async function createCommerceAction(userId, input) {
  return CommerceAction.create({
    userId,
    operation: input.operation,
    intent: input.intent,
  });
}

async function updateCommerceAction(userId, id, input) {
  const action = await CommerceAction.findOneAndUpdate(
    { _id: id, userId, state: "DRAFT", version: input.expectedVersion },
    {
      $set: { intent: input.intent },
      $unset: { preview: 1, confirmation: 1, failure: 1 },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!action) throw conflict("ACTION_NOT_EDITABLE", "Action changed or is no longer a draft");
  return action;
}

async function previewCommerceAction(userId, id, expectedVersion) {
  const current = await CommerceAction.findOne({
    _id: id,
    userId,
    version: expectedVersion,
    state: { $in: ["DRAFT", "PREVIEWED", "EXPIRED"] },
  }).lean();
  if (!current) throw conflict("ACTION_NOT_PREVIEWABLE", "Action changed or cannot be previewed");

  const upstream = await callSwiggyReadTool(userId, "dineout", "get_available_slots", {
    restaurantId: current.intent.restaurantId,
    date: current.intent.date,
    latitude: current.intent.latitude,
    longitude: current.intent.longitude,
  });
  const selectedSlot = selectedSlotFromResponse(upstream, current.intent);
  if (!selectedSlot || !selectedSlot.isFree || selectedSlot.bookingPrice !== 0) {
    throw badRequest(
      "DINEOUT_SLOT_NOT_AVAILABLE",
      "The selected free reservation slot is no longer available",
    );
  }

  const preview = {
    selectedSlot,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 5 * 60_000),
  };
  preview.hash = hashObject({ operation: current.operation, intent: current.intent, selectedSlot });

  const action = await CommerceAction.findOneAndUpdate(
    { _id: id, userId, version: expectedVersion, state: current.state },
    {
      $set: { state: "PREVIEWED", preview },
      $unset: { confirmation: 1, submission: 1, failure: 1 },
      $inc: { version: 1 },
    },
    { new: true },
  );
  if (!action) throw conflict("VERSION_CONFLICT", "Action changed while previewing; retry");
  return action;
}

async function finalizeAction(actionId, state, fields) {
  return CommerceAction.findOneAndUpdate(
    { _id: actionId, state: "SUBMITTING" },
    { $set: { state, ...fields }, $inc: { version: 1 } },
    { new: true },
  );
}

async function confirmCommerceAction(userId, id, input, idempotencyKey) {
  if (!getConfig().swiggy.writesEnabled) {
    throw new AppError({
      status: 503,
      code: "SWIGGY_WRITES_DISABLED",
      message: "Swiggy booking writes are disabled in this environment",
    });
  }

  const idempotencyKeyHash = hashSecret(`${userId}|DINEOUT_BOOKING|${idempotencyKey}`);
  const prior = await CommerceAction.findOne({
    userId,
    operation: "DINEOUT_BOOKING",
    "confirmation.idempotencyKeyHash": idempotencyKeyHash,
  });
  if (prior) {
    if (String(prior._id) !== id) {
      throw conflict("IDEMPOTENCY_KEY_REUSED", "This idempotency key belongs to another action");
    }
    return prior;
  }

  const claimed = await CommerceAction.findOneAndUpdate(
    {
      _id: id,
      userId,
      operation: "DINEOUT_BOOKING",
      state: "PREVIEWED",
      version: input.expectedVersion,
      "preview.hash": input.previewHash,
      "preview.expiresAt": { $gt: new Date() },
    },
    {
      $set: {
        state: "SUBMITTING",
        confirmation: { idempotencyKeyHash, confirmedAt: new Date() },
        "submission.attemptedAt": new Date(),
      },
      $inc: { version: 1 },
    },
    { new: true },
  );
  if (!claimed) {
    throw conflict(
      "CONFIRMATION_REJECTED",
      "Preview expired, changed, was already confirmed, or has the wrong version",
    );
  }

  const args = {
    restaurantId: claimed.intent.restaurantId,
    slotId: claimed.intent.slotId,
    itemId: claimed.intent.itemId,
    reservationTime: claimed.intent.reservationTime,
    guestCount: claimed.intent.guestCount,
    latitude: claimed.intent.latitude,
    longitude: claimed.intent.longitude,
  };

  try {
    const providerResponse = await callSwiggyDineoutBooking(userId, args);
    return await finalizeAction(claimed._id, "SUBMITTED", {
      "submission.completedAt": new Date(),
      "submission.response": providerResponse,
      "submission.responseHash": hashObject(providerResponse),
      "submission.providerExternalReference": findExternalReference(providerResponse),
    });
  } catch (error) {
    if (error instanceof SwiggyWriteAmbiguousError) {
      return finalizeAction(claimed._id, "RECONCILIATION_REQUIRED", {
        nextReconcileAt: new Date(Date.now() + 30_000),
        failure: {
          code: "AMBIGUOUS_PROVIDER_OUTCOME",
          message: "Booking outcome is unknown; do not retry",
          occurredAt: new Date(),
        },
      });
    }
    if (error instanceof SwiggyToolRejectedError) {
      return finalizeAction(claimed._id, "FAILED", {
        failure: {
          code: "PROVIDER_REJECTED",
          message: "Swiggy rejected the booking and reported no confirmed side effect",
          occurredAt: new Date(),
        },
        "submission.response": error.result,
        "submission.responseHash": hashObject(error.result),
      });
    }
    return finalizeAction(claimed._id, "FAILED", {
      failure: {
        code: error.code || "PRE_DISPATCH_FAILURE",
        message: "The booking could not be dispatched",
        occurredAt: new Date(),
      },
    });
  }
}

async function cancelCommerceAction(userId, id, expectedVersion) {
  const action = await CommerceAction.findOneAndUpdate(
    {
      _id: id,
      userId,
      version: expectedVersion,
      state: { $in: ["DRAFT", "PREVIEWED", "EXPIRED"] },
    },
    { $set: { state: "CANCELLED" }, $inc: { version: 1 } },
    { new: true },
  );
  if (!action) throw conflict("ACTION_NOT_CANCELLABLE", "Action changed or cannot be cancelled");
  return action;
}

async function listCommerceActions(userId, query) {
  const documents = await CommerceAction.find({
    userId,
    ...(query.cursor ? { _id: { $lt: query.cursor } } : {}),
    ...(query.state ? { state: query.state } : {}),
  })
    .sort({ _id: -1 })
    .limit(query.limit + 1)
    .lean();
  const hasMore = documents.length > query.limit;
  if (hasMore) documents.pop();
  return {
    documents,
    meta: { limit: query.limit, nextCursor: hasMore ? String(documents.at(-1)._id) : null },
  };
}

async function getCommerceAction(userId, id) {
  const action = await CommerceAction.findOne({ _id: id, userId }).lean();
  if (!action) throw notFound("Commerce action");
  return action;
}

export {
  createCommerceAction,
  updateCommerceAction,
  previewCommerceAction,
  confirmCommerceAction,
  cancelCommerceAction,
  listCommerceActions,
  getCommerceAction,
};
