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
    }),
  headers: z.object({}).passthrough(),
});

const autocompleteSchema = z.object({
  query: z.object({
    input: z.string().trim().min(1).max(255),
    latitude: z.coerce.number().min(-90).max(90).optional(),
    longitude: z.coerce.number().min(-180).max(180).optional(),
  }),
});

const placeDetailsSchema = z.object({
  query: z.object({
    placeId: z.string().trim().min(1).max(255),
  }),
});

export { nearbyPlacesSchema, autocompleteSchema, placeDetailsSchema };
