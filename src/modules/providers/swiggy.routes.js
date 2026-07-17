import { Router } from "express";

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

export { providerConnectionRouter, oauthRouter, swiggyCommerceRouter };
