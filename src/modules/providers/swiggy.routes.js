import { Router } from "express";
import { getNearbyRestaurants } from "./swiggy-public.service.js";

import { authenticate } from "../../common/middleware/auth.js";
import { providerRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  authorizeSwiggy,
  getDineoutRestaurant,
  getDineoutSlots,
  getFoodMenu,
  getSwiggyStatus,
  listAddresses,
  listProviderConnections,
  removeSwiggyConnection,
  searchDineoutRestaurants,
  searchFoodDishes,
  searchFoodRestaurants,
  searchInstamartProducts,
  swiggyOAuthCallback,
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
} from "./swiggy.controller.js";
import {
  addressListSchema,
  dineoutDetailsSchema,
  dineoutSearchSchema,
  dineoutSlotsSchema,
  emptyProviderRequestSchema,
  foodDishSearchSchema,
  foodMenuSchema,
  foodRestaurantSearchSchema,
  instamartProductSearchSchema,
  oauthCallbackSchema,
  updateFoodCartSchema,
  getFoodCartSchema,
  flushFoodCartSchema,
  fetchFoodCouponsSchema,
  applyFoodCouponSchema,
  placeFoodOrderSchema,
  foodOrderDetailsSchema,
  trackFoodOrderSchema,
  updateInstamartCartSchema,
  getInstamartCartSchema,
  clearInstamartCartSchema,
  instamartCheckoutSchema,
  listInstamartOrdersSchema,
  instamartOrderDetailsSchema,
  trackInstamartOrderSchema,
  goToItemsSchema,
} from "./swiggy.schemas.js";

const providerConnectionRouter = Router();
providerConnectionRouter.use(authenticate);
providerConnectionRouter.get("/", asyncHandler(listProviderConnections));
providerConnectionRouter.get("/swiggy", asyncHandler(getSwiggyStatus));
providerConnectionRouter.post(
  "/swiggy/authorize",
  providerRateLimit,
  validate(emptyProviderRequestSchema),
  asyncHandler(authorizeSwiggy),
);
providerConnectionRouter.delete("/swiggy", asyncHandler(removeSwiggyConnection));

const oauthRouter = Router();
oauthRouter.get(
  "/swiggy/callback",
  providerRateLimit,
  validate(oauthCallbackSchema),
  asyncHandler(swiggyOAuthCallback),
);

const swiggyPublicRouter = Router();
swiggyPublicRouter.get(
  "/food/nearby/restaurants",
  providerRateLimit,
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });
    const data = await getNearbyRestaurants(lat, lng);
    res.json(data);
  })
);

const swiggyCommerceRouter = Router();
swiggyCommerceRouter.use(authenticate, providerRateLimit);
swiggyCommerceRouter.get("/addresses", validate(addressListSchema), asyncHandler(listAddresses));
swiggyCommerceRouter.get(
  "/food/restaurants",
  validate(foodRestaurantSearchSchema),
  asyncHandler(searchFoodRestaurants),
);
swiggyCommerceRouter.get(
  "/food/dishes",
  validate(foodDishSearchSchema),
  asyncHandler(searchFoodDishes),
);
swiggyCommerceRouter.get(
  "/food/restaurants/:restaurantId/menu",
  validate(foodMenuSchema),
  asyncHandler(getFoodMenu),
);
swiggyCommerceRouter.get(
  "/instamart/products",
  validate(instamartProductSearchSchema),
  asyncHandler(searchInstamartProducts),
);
swiggyCommerceRouter.get(
  "/dineout/restaurants",
  validate(dineoutSearchSchema),
  asyncHandler(searchDineoutRestaurants),
);
swiggyCommerceRouter.get(
  "/dineout/restaurants/:restaurantId",
  validate(dineoutDetailsSchema),
  asyncHandler(getDineoutRestaurant),
);
swiggyCommerceRouter.get(
  "/dineout/restaurants/:restaurantId/slots",
  validate(dineoutSlotsSchema),
  asyncHandler(getDineoutSlots),
);

// Food Cart & Coupons
swiggyCommerceRouter.post("/food/cart", validate(updateFoodCartSchema), asyncHandler(updateFoodCart));
swiggyCommerceRouter.get("/food/cart", validate(getFoodCartSchema), asyncHandler(getFoodCart));
swiggyCommerceRouter.delete("/food/cart", validate(flushFoodCartSchema), asyncHandler(flushFoodCart));
swiggyCommerceRouter.get("/food/coupons", validate(fetchFoodCouponsSchema), asyncHandler(fetchFoodCoupons));
swiggyCommerceRouter.post("/food/coupons/apply", validate(applyFoodCouponSchema), asyncHandler(applyFoodCoupon));

// Food Orders
swiggyCommerceRouter.post("/food/order", validate(placeFoodOrderSchema), asyncHandler(placeFoodOrder));
swiggyCommerceRouter.get("/food/orders", asyncHandler(listFoodOrders));
swiggyCommerceRouter.get("/food/orders/:orderId", validate(foodOrderDetailsSchema), asyncHandler(getFoodOrderDetails));
swiggyCommerceRouter.get("/food/orders/:orderId/track", validate(trackFoodOrderSchema), asyncHandler(trackFoodOrder));

// Instamart Cart
swiggyCommerceRouter.post("/instamart/cart", validate(updateInstamartCartSchema), asyncHandler(updateInstamartCart));
swiggyCommerceRouter.get("/instamart/cart", validate(getInstamartCartSchema), asyncHandler(getInstamartCart));
swiggyCommerceRouter.delete("/instamart/cart", validate(clearInstamartCartSchema), asyncHandler(clearInstamartCart));
swiggyCommerceRouter.get("/instamart/go-to-items", validate(goToItemsSchema), asyncHandler(getGoToItems));

// Instamart Orders
swiggyCommerceRouter.post("/instamart/checkout", validate(instamartCheckoutSchema), asyncHandler(instamartCheckout));
swiggyCommerceRouter.get("/instamart/orders", validate(listInstamartOrdersSchema), asyncHandler(listInstamartOrders));
swiggyCommerceRouter.get("/instamart/orders/:orderId", validate(instamartOrderDetailsSchema), asyncHandler(getInstamartOrderDetails));
swiggyCommerceRouter.get("/instamart/orders/:orderId/track", validate(trackInstamartOrderSchema), asyncHandler(trackInstamartOrder));

export { providerConnectionRouter, oauthRouter, swiggyCommerceRouter, swiggyPublicRouter };
