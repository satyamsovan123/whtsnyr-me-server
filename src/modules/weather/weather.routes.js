import { Router } from "express";
import { z } from "zod";

import { validate } from "../../common/middleware/validate.js";
import { asyncHandler } from "../../common/utils/async-handler.js";
import { getWeather } from "./weather.controller.js";

const weatherQuerySchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
    }),
  headers: z.object({}).passthrough(),
});

const weatherRouter = Router();

weatherRouter.get("/", validate(weatherQuerySchema), asyncHandler(getWeather));

export { weatherRouter };
