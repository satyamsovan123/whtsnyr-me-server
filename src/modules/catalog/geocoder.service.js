import { AppError } from "../../common/errors/app-error.js";
import { getConfig } from "../../config/env.js";

async function geocodeLocation(query) {
  const config = getConfig();
  if (!config.geocoding.enabled) {
    return [];
  }

  const url = new URL(`${config.geocoding.baseUrl}/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "5");
  url.searchParams.set("countrycodes", "in");

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": config.geocoding.userAgent,
      },
      redirect: "error",
      signal: AbortSignal.timeout(7000),
    });
  } catch (error) {
    throw new AppError({
      status: 502,
      code: "GEOCODER_UNAVAILABLE",
      message: "Location lookup is temporarily unavailable; coordinates can be supplied directly",
      cause: error,
    });
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (!response.ok || contentLength > 1_000_000) {
    throw new AppError({
      status: 502,
      code: "GEOCODER_ERROR",
      message: "The location provider returned an invalid response",
    });
  }

  const text = await response.text();
  if (text.length > 1_000_000) {
    throw new AppError({
      status: 502,
      code: "GEOCODER_RESPONSE_TOO_LARGE",
      message: "The location provider response exceeded the size limit",
    });
  }

  let payload;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new AppError({
      status: 502,
      code: "GEOCODER_INVALID_JSON",
      message: "The location provider returned malformed data",
      cause: error,
    });
  }

  return payload.slice(0, 5).map((item) => ({
    provider: "nominatim",
    providerPlaceId: String(item.place_id),
    displayName: String(item.display_name).slice(0, 500),
    latitude: Number(item.lat),
    longitude: Number(item.lon),
    address: {
      locality: item.address?.suburb || item.address?.neighbourhood || item.address?.village,
      city: item.address?.city || item.address?.town,
      state: item.address?.state,
      postalCode: item.address?.postcode,
      country: item.address?.country,
    },
  }));
}

export { geocodeLocation };
