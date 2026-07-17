import { sendData } from "../../common/utils/api-response.js";
import { findNearbyPlaces } from "./places.service.js";

/**
 * Controller to handle fetching dynamic nearby places via the maps provider.
 * Expects latitude, longitude, type, and radius in the query string.
 */
async function getNearbyPlaces(request, response) {
  const { latitude, longitude, type, radius } = request.validated.query;
  const data = await findNearbyPlaces(latitude, longitude, type, radius);
  return sendData(response, data);
}

export { getNearbyPlaces };
