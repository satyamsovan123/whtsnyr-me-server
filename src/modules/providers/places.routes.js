import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.js";
import { providerRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { getNearbyPlaces, getAutocomplete, getPlaceDetails } from "./places.controller.js";
import { nearbyPlacesSchema, autocompleteSchema, placeDetailsSchema } from "./places.schemas.js";

const placesRouter = Router();

placesRouter.use(providerRateLimit);

placesRouter.get("/nearby", validate(nearbyPlacesSchema), asyncHandler(getNearbyPlaces));
placesRouter.get("/autocomplete", validate(autocompleteSchema), asyncHandler(getAutocomplete));
placesRouter.get("/details", validate(placeDetailsSchema), asyncHandler(getPlaceDetails));

export { placesRouter };
