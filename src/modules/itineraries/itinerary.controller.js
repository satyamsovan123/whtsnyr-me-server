import { conflict, notFound } from "../../common/errors/app-error.js";
import { sendData } from "../../common/utils/api-response.js";
import { Itinerary } from "./itinerary.model.js";
import { buildPlan } from "./planner.service.js";

async function planItinerary(request, response) {
  const plan = await buildPlan(request.validated.body);
  const itinerary = await Itinerary.create({
    ownerId: request.auth.userId,
    areaId: plan.area._id,
    title: plan.title,
    constraints: plan.constraints,
    stops: plan.stops,
    alternatives: plan.alternatives,
    totals: plan.totals,
    plannerNotes: plan.plannerNotes,
  });
  return sendData(response, itinerary, { status: 201 });
}

async function listItineraries(request, response) {
  const { cursor, limit, status } = request.validated.query;
  const documents = await Itinerary.find({
    ownerId: request.auth.userId,
    ...(cursor ? { _id: { $lt: cursor } } : {}),
    ...(status ? { status } : {}),
  })
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  const hasMore = documents.length > limit;
  if (hasMore) documents.pop();
  return sendData(response, documents, {
    meta: { limit, nextCursor: hasMore ? String(documents.at(-1)._id) : null },
  });
}

async function getItinerary(request, response) {
  const itinerary = await Itinerary.findOne({
    _id: request.validated.params.id,
    ownerId: request.auth.userId,
  }).lean();
  if (!itinerary) throw notFound("Itinerary");
  return sendData(response, itinerary);
}

async function updateItinerary(request, response) {
  const { expectedVersion, ...patch } = request.validated.body;
  const itinerary = await Itinerary.findOneAndUpdate(
    {
      _id: request.validated.params.id,
      ownerId: request.auth.userId,
      version: expectedVersion,
      status: { $ne: "ARCHIVED" },
    },
    { $set: patch, $inc: { version: 1 } },
    { new: true, runValidators: true },
  );
  if (!itinerary) throw conflict("VERSION_CONFLICT", "Itinerary changed or is archived");
  return sendData(response, itinerary);
}

async function replanItinerary(request, response) {
  const current = await Itinerary.findOne({
    _id: request.validated.params.id,
    ownerId: request.auth.userId,
    version: request.validated.body.expectedVersion,
    status: { $ne: "ARCHIVED" },
  }).lean();
  if (!current) throw conflict("VERSION_CONFLICT", "Itinerary changed or is archived");

  const stored = current.constraints;
  const merged = {
    areaId: String(request.validated.body.constraints.areaId || current.areaId),
    durationHours: request.validated.body.constraints.durationHours ?? stored.durationHours,
    startAt: request.validated.body.constraints.startAt ?? stored.startAt,
    budgetMinor: request.validated.body.constraints.budgetMinor ?? stored.budgetMinor,
    groupSize: request.validated.body.constraints.groupSize ?? stored.groupSize,
    interests: request.validated.body.constraints.interests ?? stored.interests,
    placeTypes: request.validated.body.constraints.placeTypes ?? stored.placeTypes,
    mobility: request.validated.body.constraints.mobility ?? stored.mobility,
    indoorPreference:
      request.validated.body.constraints.indoorPreference ?? stored.indoorPreference,
    startLocation:
      request.validated.body.constraints.startLocation ??
      (stored.startLocation
        ? {
            longitude: stored.startLocation.coordinates[0],
            latitude: stored.startLocation.coordinates[1],
          }
        : undefined),
  };
  const plan = await buildPlan(merged);
  const itinerary = await Itinerary.findOneAndUpdate(
    {
      _id: current._id,
      ownerId: request.auth.userId,
      version: request.validated.body.expectedVersion,
    },
    {
      $set: {
        areaId: plan.area._id,
        constraints: plan.constraints,
        stops: plan.stops,
        alternatives: plan.alternatives,
        totals: plan.totals,
        plannerNotes: plan.plannerNotes,
        status: "DRAFT",
      },
      $inc: { version: 1 },
    },
    { new: true, runValidators: true },
  );
  if (!itinerary) throw conflict("VERSION_CONFLICT", "Itinerary changed while replanning");
  return sendData(response, itinerary);
}

async function transition(request, response, status) {
  const itinerary = await Itinerary.findOneAndUpdate(
    {
      _id: request.validated.params.id,
      ownerId: request.auth.userId,
      version: request.validated.body.expectedVersion,
      status: { $ne: "ARCHIVED" },
    },
    { $set: { status }, $inc: { version: 1 } },
    { new: true },
  );
  if (!itinerary) throw conflict("VERSION_CONFLICT", "Itinerary changed or is archived");
  return sendData(response, itinerary);
}

function saveItinerary(request, response) {
  return transition(request, response, "SAVED");
}

function archiveItinerary(request, response) {
  return transition(request, response, "ARCHIVED");
}

export {
  planItinerary,
  listItineraries,
  getItinerary,
  updateItinerary,
  replanItinerary,
  saveItinerary,
  archiveItinerary,
};
