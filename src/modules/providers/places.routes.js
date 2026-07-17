import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.js";
import { providerRateLimit } from "../../common/middleware/rate-limit.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { getNearbyPlaces } from "./places.controller.js";
import { nearbyPlacesSchema } from "./places.schemas.js";

const placesRouter = Router();

placesRouter.use(authenticate, providerRateLimit);

placesRouter.get("/nearby", validate(nearbyPlacesSchema), asyncHandler(getNearbyPlaces));

export { placesRouter };
