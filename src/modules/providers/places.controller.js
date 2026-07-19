import { sendData } from "../../common/utils/api-response.js";
import { findNearbyPlaces, autocompletePlaces, getPlaceDetailsById } from "./places.service.js";

/**
 * Controller to handle fetching dynamic nearby places via the maps provider.
 * Expects latitude, longitude, type, and radius in the query string.
 */
async function getNearbyPlaces(request, response) {
  const { latitude, longitude, type, radius } = request.validated.query;
  const data = await findNearbyPlaces(latitude, longitude, type, radius);
  return sendData(response, data);
}

async function getAutocomplete(request, response) {
  const { input, latitude, longitude } = request.validated.query;
  const data = await autocompletePlaces(input, latitude, longitude);
  return sendData(response, data);
}

async function getPlaceDetails(request, response) {
  const { placeId } = request.validated.query;
  const data = await getPlaceDetailsById(placeId);
  return sendData(response, data);
}

export { getNearbyPlaces, getAutocomplete, getPlaceDetails };
