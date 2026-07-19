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
/**
 * Calculates distance in kilometers between two coordinates using Haversine formula
 */
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1);
  var dLon = deg2rad(lon2 - lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

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
    const places = (data.results || []).map((place) => {
      const pLat = place.geometry?.location?.lat;
      const pLng = place.geometry?.location?.lng;
      const distance = (pLat != null && pLng != null) ? getDistanceFromLatLonInKm(latitude, longitude, pLat, pLng) : 0;
      
      return {
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        userRatingsTotal: place.user_ratings_total,
        types: place.types,
        distance,
        location: {
          latitude: pLat,
          longitude: pLng,
        },
        openNow: place.opening_hours?.open_now,
        icon: place.icon,
        photoUrl: place.photos?.[0]?.photo_reference ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMaps.apiKey}` : null,
      };
    });

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

async function autocompletePlaces(input, latitude, longitude) {
  const { googleMaps } = getConfig();
  if (!googleMaps.apiKey) {
    throw new AppError({
      status: 503,
      code: "GOOGLE_MAPS_NOT_CONFIGURED",
      message: "Google Maps API key is missing from the environment",
    });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
    url.searchParams.set("input", input);
    url.searchParams.set("key", googleMaps.apiKey);
    
    if (latitude != null && longitude != null) {
      url.searchParams.set("location", `${latitude},${longitude}`);
      url.searchParams.set("radius", "50000"); // 50km bias
    }

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Google Places API error: ${response.status}`);
    
    const data = await response.json();
    
    return {
      predictions: (data.predictions || []).map(p => ({
        placeId: p.place_id,
        description: p.description,
        mainText: p.structured_formatting?.main_text,
        secondaryText: p.structured_formatting?.secondary_text
      }))
    };
  } catch (error) {
    console.error("Failed to fetch autocomplete:", error);
    throw new AppError({ status: 502, code: "PLACES_API_UNAVAILABLE", message: "Failed to fetch autocomplete", cause: error });
  }
}

async function getPlaceDetailsById(placeId) {
  const { googleMaps } = getConfig();
  if (!googleMaps.apiKey) {
    throw new AppError({
      status: 503,
      code: "GOOGLE_MAPS_NOT_CONFIGURED",
      message: "Google Maps API key is missing from the environment",
    });
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", "geometry");
    url.searchParams.set("key", googleMaps.apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Google Places API error: ${response.status}`);
    
    const data = await response.json();
    if (data.status !== "OK") throw new Error(`Google Places API returned status: ${data.status}`);

    return {
      location: {
        latitude: data.result?.geometry?.location?.lat,
        longitude: data.result?.geometry?.location?.lng,
      }
    };
  } catch (error) {
    console.error("Failed to fetch place details:", error);
    throw new AppError({ status: 502, code: "PLACES_API_UNAVAILABLE", message: "Failed to fetch place details", cause: error });
  }
}

export { findNearbyPlaces, autocompletePlaces, getPlaceDetailsById };
