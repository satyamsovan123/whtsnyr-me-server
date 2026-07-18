import { AppError } from "../../common/errors/app-error.js";
import { getConfig } from "../../config/env.js";

/**
 * Finds nearby places using the Google Places API.
 * @param {number} latitude - The latitude to search around.
 * @param {number} longitude - The longitude to search around.
 * @param {string} [type="tourist_attraction"] - The type of place to search for (e.g., "cafe", "hospital").
 * @param {number} [radius=1500] - Search radius in meters.
 * @returns {Promise<{available: boolean, places: Array<Object>}>} The standardized list of nearby places.
 */

async function findNearbyPlaces(latitude, longitude, type = "tourist_attraction", radius = 1500) {
  const { googleMaps } = getConfig();
  
  if (!googleMaps.apiKey) {
    throw new AppError({
      status: 503,
      code: "GOOGLE_MAPS_NOT_CONFIGURED",
      message: "Google Maps API key is missing from the environment",
    });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
    url.searchParams.set("location", `${latitude},${longitude}`);
    url.searchParams.set("radius", radius.toString());
    url.searchParams.set("type", type);
    url.searchParams.set("key", googleMaps.apiKey);

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      throw new Error(`Google Places API returned status: ${data.status}`);
    }

    // Standardize the response format
    const places = (data.results || []).map((place) => ({
      providerId: place.place_id,
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      location: {
        latitude: place.geometry?.location?.lat,
        longitude: place.geometry?.location?.lng,
      },
      openNow: place.opening_hours?.open_now,
      icon: place.icon,
      photoUrl: place.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMaps.apiKey}` : null,
    }));

    return {
      available: true,
      places,
    };
  } catch (error) {
    console.error("Failed to fetch nearby places from Google Maps:", error);
    throw new AppError({
      status: 502,
      code: "PLACES_API_UNAVAILABLE",
      message: "Failed to fetch nearby places",
      cause: error,
    });
  }
}

export { findNearbyPlaces };
