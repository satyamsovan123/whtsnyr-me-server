import { Router } from "express";

import { authenticate } from "../../common/middleware/auth.js";
import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import {
  archiveItinerary,
  getItinerary,
  listItineraries,
  planItinerary,
  replanItinerary,
  saveItinerary,
  updateItinerary,
} from "./itinerary.controller.js";
import {
  itineraryIdSchema,
  itineraryListSchema,
  planItinerarySchema,
  replanItinerarySchema,
  transitionItinerarySchema,
  updateItinerarySchema,
} from "./itinerary.schemas.js";

const itineraryRouter = Router();
itineraryRouter.use(authenticate);
itineraryRouter.post("/plan", validate(planItinerarySchema), asyncHandler(planItinerary));
itineraryRouter.get("/", validate(itineraryListSchema), asyncHandler(listItineraries));
itineraryRouter.get("/:id", validate(itineraryIdSchema), asyncHandler(getItinerary));
itineraryRouter.patch("/:id", validate(updateItinerarySchema), asyncHandler(updateItinerary));
itineraryRouter.post("/:id/replan", validate(replanItinerarySchema), asyncHandler(replanItinerary));
itineraryRouter.post("/:id/save", validate(transitionItinerarySchema), asyncHandler(saveItinerary));
itineraryRouter.post(
  "/:id/archive",
  validate(transitionItinerarySchema),
  asyncHandler(archiveItinerary),
);

export { itineraryRouter };
