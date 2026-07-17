import { z } from "zod";

const nearbyPlacesSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
      type: z.string().trim().max(50).default("tourist_attraction"),
      radius: z.coerce.number().min(100).max(50000).default(1500),
    })
    .strict(),
  headers: z.object({}).passthrough(),
});

export { nearbyPlacesSchema };
