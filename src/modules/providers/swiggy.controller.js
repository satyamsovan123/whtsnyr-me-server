import { sendData } from "../../common/utils/api-response.js";
import { getConfig } from "../../config/env.js";
import { callSwiggyReadTool } from "./swiggy-mcp.service.js";
import {
  beginSwiggyAuthorization,
  completeSwiggyAuthorization,
  disconnectSwiggy,
  failSwiggyAuthorization,
  getSwiggyConnection,
} from "./swiggy-oauth.service.js";

function callbackRedirect(status, reason) {
  const url = new URL("/integrations/swiggy", getConfig().frontendUrl);
  url.searchParams.set("status", status);
  if (reason) url.searchParams.set("reason", reason);
  return url.toString();
}

async function listProviderConnections(request, response) {
  return sendData(response, [await getSwiggyConnection(request.auth.userId)]);
}

async function getSwiggyStatus(request, response) {
  return sendData(response, await getSwiggyConnection(request.auth.userId));
}

async function authorizeSwiggy(request, response) {
  return sendData(response, await beginSwiggyAuthorization(request.auth.userId), { status: 201 });
}

async function swiggyOAuthCallback(request, response) {
  const { code, state, error } = request.validated.query;
  if (error) {
    await failSwiggyAuthorization(state);
    return response.redirect(302, callbackRedirect("error", "authorization_denied"));
  }
  await completeSwiggyAuthorization({ code, state });
  return response.redirect(302, callbackRedirect("connected"));
}

async function removeSwiggyConnection(request, response) {
  return sendData(response, await disconnectSwiggy(request.auth.userId));
}

async function listAddresses(request, response) {
  const server = request.validated.query.server;
  const data = await callSwiggyReadTool(request.auth.userId, server, "get_addresses", {});
  return sendData(response, data);
}

async function searchFoodRestaurants(request, response) {
  const { addressId, query, offset } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "search_restaurants", {
      addressId,
      query,
      offset,
    }),
  );
}

async function searchFoodDishes(request, response) {
  const { addressId, query, restaurantId, vegOnly, offset } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "search_menu", {
      addressId,
      query,
      ...(restaurantId ? { restaurantIdOfAddedItem: restaurantId } : {}),
      ...(vegOnly !== undefined ? { vegFilter: vegOnly ? 1 : 0 } : {}),
      offset,
    }),
  );
}

async function getFoodMenu(request, response) {
  const { addressId, page, pageSize } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "get_restaurant_menu", {
      addressId,
      restaurantId: request.validated.params.restaurantId,
      page,
      pageSize,
    }),
  );
}

async function searchInstamartProducts(request, response) {
  const { addressId, query, offset } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "instamart", "search_products", {
      addressId,
      query,
      offset,
    }),
  );
}

async function searchDineoutRestaurants(request, response) {
  const { query, entityType, addressId, latitude, longitude } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "dineout", "search_restaurants_dineout", {
      query,
      ...(entityType ? { entityType } : {}),
      ...(addressId ? { addressId } : { latitude, longitude }),
    }),
  );
}

async function getDineoutRestaurant(request, response) {
  const { latitude, longitude } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "dineout", "get_restaurant_details", {
      restaurantId: request.validated.params.restaurantId,
      latitude,
      longitude,
    }),
  );
}

async function getDineoutSlots(request, response) {
  const { date, latitude, longitude } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "dineout", "get_available_slots", {
      restaurantId: request.validated.params.restaurantId,
      date,
      latitude,
      longitude,
    }),
  );
}

export {
  listProviderConnections,
  getSwiggyStatus,
  authorizeSwiggy,
  swiggyOAuthCallback,
  removeSwiggyConnection,
  listAddresses,
  searchFoodRestaurants,
  searchFoodDishes,
  getFoodMenu,
  searchInstamartProducts,
  searchDineoutRestaurants,
  getDineoutRestaurant,
  getDineoutSlots,
};
