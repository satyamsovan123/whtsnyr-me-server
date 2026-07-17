import { sendData } from "../../common/utils/api-response.js";
import { getConfig } from "../../config/env.js";
import { callSwiggyReadTool, callSwiggyWriteTool } from "./swiggy-mcp.service.js";
import {
  beginSwiggyAuthorization,
  completeSwiggyAuthorization,
  disconnectSwiggy,
  failSwiggyAuthorization,
  getSwiggyConnection,
} from "./swiggy-oauth.service.js";

/** Builds frontend redirect URL for Swiggy OAuth outcomes. */
function callbackRedirect(status, reason) {
  const url = new URL("/integrations/swiggy", getConfig().frontendUrl);
  url.searchParams.set("status", status);
  if (reason) url.searchParams.set("reason", reason);
  return url.toString();
}

/** Lists provider connection records for the current user. */
async function listProviderConnections(request, response) {
  return sendData(response, [await getSwiggyConnection(request.auth.userId)]);
}

/** Returns Swiggy provider connection status. */
async function getSwiggyStatus(request, response) {
  return sendData(response, await getSwiggyConnection(request.auth.userId));
}

/** Starts Swiggy OAuth authorization flow. */
async function authorizeSwiggy(request, response) {
  return sendData(response, await beginSwiggyAuthorization(request.auth.userId), { status: 201 });
}

/** Handles Swiggy OAuth callback and redirects to frontend status page. */
async function swiggyOAuthCallback(request, response) {
  const { code, state, error } = request.validated.query;
  if (error) {
    await failSwiggyAuthorization(state);
    return response.redirect(302, callbackRedirect("error", "authorization_denied"));
  }
  await completeSwiggyAuthorization({ code, state });
  return response.redirect(302, callbackRedirect("connected"));
}

/** Removes stored Swiggy connection for the current user. */
async function removeSwiggyConnection(request, response) {
  return sendData(response, await disconnectSwiggy(request.auth.userId));
}

/** Lists addresses for a chosen Swiggy server. */
async function listAddresses(request, response) {
  const server = request.validated.query.server;
  const data = await callSwiggyReadTool(request.auth.userId, server, "get_addresses", {});
  return sendData(response, data);
}

/** Searches food restaurants via Swiggy. */
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

/** Searches food dishes via Swiggy. */
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

/** Gets paged food menu for a restaurant. */
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

/** Searches Instamart products via Swiggy. */
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

/** Searches Dineout restaurants via Swiggy. */
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

/** Gets Dineout restaurant details. */
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

/** Gets available Dineout booking slots. */
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

// FOOD CART
async function updateFoodCart(request, response) {
  const { addressId, items } = request.validated.body;
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "food", "update_food_cart", { addressId, items })
  );
}

async function getFoodCart(request, response) {
  const { addressId } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "get_food_cart", { addressId })
  );
}

async function flushFoodCart(request, response) {
  const { addressId } = request.validated.query;
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "food", "flush_food_cart", { addressId })
  );
}

// FOOD COUPONS
async function fetchFoodCoupons(request, response) {
  const { addressId } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "fetch_food_coupons", { addressId })
  );
}

async function applyFoodCoupon(request, response) {
  const { addressId, couponCode } = request.validated.body;
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "food", "apply_food_coupon", { addressId, couponCode })
  );
}

// FOOD ORDERS
async function placeFoodOrder(request, response) {
  const { addressId } = request.validated.body;
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "food", "place_food_order", { addressId })
  );
}

async function listFoodOrders(request, response) {
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "get_food_orders", {})
  );
}

async function getFoodOrderDetails(request, response) {
  const { orderId } = request.validated.params;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "get_food_order_details", { orderId })
  );
}

async function trackFoodOrder(request, response) {
  const { orderId } = request.validated.params;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "food", "track_food_order", { orderId })
  );
}

// INSTAMART CART
async function updateInstamartCart(request, response) {
  const { addressId, items } = request.validated.body;
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "instamart", "update_cart", { addressId, items })
  );
}

async function getInstamartCart(request, response) {
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "instamart", "get_cart", {})
  );
}

async function clearInstamartCart(request, response) {
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "instamart", "clear_cart", {})
  );
}

// INSTAMART ORDERS
async function instamartCheckout(request, response) {
  const { addressId } = request.validated.body;
  return sendData(
    response,
    await callSwiggyWriteTool(request.auth.userId, "instamart", "checkout", { addressId })
  );
}

async function listInstamartOrders(request, response) {
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "instamart", "get_orders", {})
  );
}

async function getInstamartOrderDetails(request, response) {
  const { orderId } = request.validated.params;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "instamart", "get_order_details", { orderId })
  );
}

async function trackInstamartOrder(request, response) {
  const { orderId } = request.validated.params;
  const { lat, lng } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "instamart", "track_order", { orderId, lat, lng })
  );
}

// INSTAMART GO-TO ITEMS
async function getGoToItems(request, response) {
  const { addressId } = request.validated.query;
  return sendData(
    response,
    await callSwiggyReadTool(request.auth.userId, "instamart", "your_go_to_items", { addressId })
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
  updateFoodCart,
  getFoodCart,
  flushFoodCart,
  fetchFoodCoupons,
  applyFoodCoupon,
  placeFoodOrder,
  listFoodOrders,
  getFoodOrderDetails,
  trackFoodOrder,
  updateInstamartCart,
  getInstamartCart,
  clearInstamartCart,
  instamartCheckout,
  listInstamartOrders,
  getInstamartOrderDetails,
  trackInstamartOrder,
  getGoToItems,
};
