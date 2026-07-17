import { badRequest, notFound } from "../../common/errors/app-error.js";
import { Area } from "../catalog/area.model.js";
import { Place } from "../catalog/place.model.js";

const WALKING_KM_PER_MINUTE = 0.075;

function point(input) {
  if (!input) return undefined;
  return { type: "Point", coordinates: [input.longitude, input.latitude] };
}

function radians(value) {
  return (value * Math.PI) / 180;
}

function distanceKm(left, right) {
  if (!left || !right) return 0;
  const [leftLng, leftLat] = left.coordinates;
  const [rightLng, rightLat] = right.coordinates;
  const deltaLat = radians(rightLat - leftLat);
  const deltaLng = radians(rightLng - leftLng);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(leftLat)) * Math.cos(radians(rightLat)) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function score(place, constraints) {
  let value = 1;
  const wanted = new Set(
    [...constraints.interests, ...constraints.placeTypes].map((item) => item.toLowerCase()),
  );
  for (const tag of [...place.tags, ...place.types].map((item) => item.toLowerCase())) {
    if (wanted.has(tag)) value += 3;
  }
  if (constraints.indoorPreference === place.indoor) value += 2;
  if (constraints.groupSize > 2 && place.familyFriendly) value += 1;
  if (place.lastVerifiedAt > new Date(Date.now() - 90 * 86_400_000)) value += 1;
  return value;
}

function snapshot(place) {
  return {
    name: place.name,
    summary: place.summary,
    location: place.location,
    types: place.types,
    priceBand: place.priceBand,
    entryFeeMinor: place.entryFeeMinor,
    lastVerifiedAt: place.lastVerifiedAt,
  };
}

async function buildPlan(rawConstraints) {
  const constraints = {
    ...rawConstraints,
    startAt: rawConstraints.startAt || new Date(),
    startLocation: point(rawConstraints.startLocation),
  };
  const area = await Area.findOne({
    _id: constraints.areaId,
    status: "PUBLISHED",
    archivedAt: null,
  }).lean();
  if (!area) throw notFound("Area");

  const filter = {
    areaId: constraints.areaId,
    status: "PUBLISHED",
    archivedAt: null,
    lastVerifiedAt: { $ne: null },
    "sourceRefs.0": { $exists: true },
  };
  if (constraints.placeTypes.length) filter.types = { $in: constraints.placeTypes };
  if (constraints.mobility === "WHEELCHAIR_ACCESSIBLE") {
    filter["accessibility.wheelchairAccessible"] = true;
  }
  if (constraints.indoorPreference !== undefined) filter.indoor = constraints.indoorPreference;

  const candidates = await Place.find(filter).limit(120).lean();
  if (!candidates.length) {
    throw badRequest(
      "NO_VERIFIED_MATCHES",
      "No published, verified places meet these constraints; widen the filters",
    );
  }

  candidates.sort((left, right) => score(right, constraints) - score(left, constraints));
  const availableMinutes = constraints.durationHours * 60;
  const maxWalkingKm = constraints.mobility === "LOW_WALKING" ? 2 : 8;
  const stops = [];
  const alternatives = [];
  let cursorTime = new Date(constraints.startAt);
  let currentLocation = constraints.startLocation || area.center;
  let usedMinutes = 0;
  let usedBudget = 0;
  let walkingDistanceKm = 0;

  for (const place of candidates) {
    const legDistance = distanceKm(currentLocation, place.location);
    const travelMinutes = Math.ceil(legDistance / WALKING_KM_PER_MINUTE);
    const visitMinutes = place.visitDurationMinutes || 60;
    const totalMinutes = travelMinutes + visitMinutes;
    const cost = (place.entryFeeMinor || 0) * constraints.groupSize;
    const fits =
      usedMinutes + totalMinutes <= availableMinutes &&
      walkingDistanceKm + legDistance <= maxWalkingKm &&
      (constraints.budgetMinor === undefined || usedBudget + cost <= constraints.budgetMinor);

    const start = new Date(cursorTime.getTime() + travelMinutes * 60_000);
    const end = new Date(start.getTime() + visitMinutes * 60_000);
    const planned = {
      position: fits ? stops.length : alternatives.length,
      placeId: place._id,
      startsAt: start,
      endsAt: end,
      travelMinutes,
      distanceKm: Number(legDistance.toFixed(2)),
      snapshot: snapshot(place),
    };

    if (fits && stops.length < 8) {
      stops.push(planned);
      usedMinutes += totalMinutes;
      usedBudget += cost;
      walkingDistanceKm += legDistance;
      currentLocation = place.location;
      cursorTime = end;
    } else if (alternatives.length < 5) {
      alternatives.push(planned);
    }
  }

  if (!stops.length) {
    throw badRequest(
      "CONSTRAINTS_TOO_STRICT",
      "Verified places exist, but none fit the time, budget, and mobility limits",
    );
  }

  return {
    area,
    constraints,
    title: `${constraints.durationHours}-hour visit to ${area.name}`,
    stops,
    alternatives,
    totals: {
      durationMinutes: usedMinutes,
      estimatedCostMinor: usedBudget,
      walkingDistanceKm: Number(walkingDistanceKm.toFixed(2)),
    },
    plannerNotes: [
      "Uses only published records with a source and verification date.",
      "Opening hours, traffic, and live availability must be checked before departure.",
      "Walking times are estimates, not turn-by-turn routing.",
    ],
  };
}

export { buildPlan };
