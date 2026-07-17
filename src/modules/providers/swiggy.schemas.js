import { z } from "zod";

const emptyBody = z.object({}).strict().default({});
const passthroughHeaders = z.object({}).passthrough();

const emptyProviderRequestSchema = z.object({
  body: emptyBody,
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const oauthCallbackSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      code: z.string().min(10).max(4000).optional(),
      state: z.string().min(20).max(500),
      error: z.string().max(200).optional(),
      error_description: z.string().max(500).optional(),
    })
    .strict()
    .refine((value) => Boolean(value.code) !== Boolean(value.error), {
      message: "OAuth callback must contain either code or error",
    }),
  headers: passthroughHeaders,
});

const addressListSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({ server: z.enum(["food", "instamart"]).default("food") }).strict(),
  headers: passthroughHeaders,
});

const foodRestaurantSearchSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      addressId: z.string().trim().min(1).max(200),
      query: z.string().trim().min(1).max(100),
      offset: z.coerce.number().int().min(0).max(1000).default(0),
    })
    .strict(),
  headers: passthroughHeaders,
});

const foodDishSearchSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      addressId: z.string().trim().min(1).max(200),
      query: z.string().trim().min(1).max(100),
      restaurantId: z.string().trim().min(1).max(200).optional(),
      vegOnly: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
      offset: z.coerce.number().int().min(0).max(1000).default(0),
    })
    .strict(),
  headers: passthroughHeaders,
});

const foodMenuSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ restaurantId: z.string().trim().min(1).max(200) }),
  query: z
    .object({
      addressId: z.string().trim().min(1).max(200),
      page: z.coerce.number().int().min(1).max(100).default(1),
      pageSize: z.coerce.number().int().min(1).max(8).default(5),
    })
    .strict(),
  headers: passthroughHeaders,
});

const instamartProductSearchSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      addressId: z.string().trim().min(1).max(200),
      query: z.string().trim().min(1).max(100),
      offset: z.coerce.number().int().min(0).max(1000).default(0),
    })
    .strict(),
  headers: passthroughHeaders,
});

const dineoutCoordinates = {
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
};

const dineoutSearchSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z
    .object({
      query: z.string().trim().min(1).max(100),
      entityType: z.enum(["locality", "CUISINE", "RESTAURANT_CATEGORY"]).optional(),
      addressId: z.string().trim().min(1).max(200).optional(),
      ...dineoutCoordinates,
    })
    .strict()
    .refine(
      (value) =>
        Boolean(value.addressId) !==
        Boolean(value.latitude !== undefined && value.longitude !== undefined),
      "Provide either addressId or latitude/longitude",
    ),
  headers: passthroughHeaders,
});

const dineoutDetailsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ restaurantId: z.string().trim().min(1).max(200) }),
  query: z
    .object({
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
    })
    .strict(),
  headers: passthroughHeaders,
});

const dineoutSlotsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ restaurantId: z.string().trim().min(1).max(200) }),
  query: z
    .object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must use YYYY-MM-DD"),
      latitude: z.coerce.number().min(-90).max(90),
      longitude: z.coerce.number().min(-180).max(180),
    })
    .strict(),
  headers: passthroughHeaders,
});

// NEW FOOD CART/ORDER SCHEMAS

const updateFoodCartSchema = z.object({
  body: z.object({
    addressId: z.string().trim().min(1).max(200),
    items: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
  }).passthrough(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const getFoodCartSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({ addressId: z.string().trim().min(1).max(200) }).strict(),
  headers: passthroughHeaders,
});

const flushFoodCartSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({ addressId: z.string().trim().min(1).max(200) }).strict(),
  headers: passthroughHeaders,
});

const fetchFoodCouponsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({ addressId: z.string().trim().min(1).max(200) }).strict(),
  headers: passthroughHeaders,
});

const applyFoodCouponSchema = z.object({
  body: z.object({
    addressId: z.string().trim().min(1).max(200),
    couponCode: z.string().trim().min(1).max(50),
  }).strict(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const placeFoodOrderSchema = z.object({
  body: z.object({ addressId: z.string().trim().min(1).max(200) }).strict(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const foodOrderDetailsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ orderId: z.string().trim().min(1).max(200) }),
  query: z.object({}),
  headers: passthroughHeaders,
});

const trackFoodOrderSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ orderId: z.string().trim().min(1).max(200) }),
  query: z.object({}),
  headers: passthroughHeaders,
});

// NEW INSTAMART CART/ORDER SCHEMAS

const updateInstamartCartSchema = z.object({
  body: z.object({
    addressId: z.string().trim().min(1).max(200),
    items: z.array(z.record(z.string(), z.unknown())).min(1).max(100),
  }).passthrough(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const getInstamartCartSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const clearInstamartCartSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const instamartCheckoutSchema = z.object({
  body: z.object({ addressId: z.string().trim().min(1).max(200) }).strict(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const listInstamartOrdersSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({}),
  headers: passthroughHeaders,
});

const instamartOrderDetailsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ orderId: z.string().trim().min(1).max(200) }),
  query: z.object({}),
  headers: passthroughHeaders,
});

const trackInstamartOrderSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({ orderId: z.string().trim().min(1).max(200) }),
  query: z.object({
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
  }).strict(),
  headers: passthroughHeaders,
});

const goToItemsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}),
  query: z.object({ addressId: z.string().trim().min(1).max(200) }).strict(),
  headers: passthroughHeaders,
});

export {
  emptyProviderRequestSchema,
  oauthCallbackSchema,
  addressListSchema,
  foodRestaurantSearchSchema,
  foodDishSearchSchema,
  foodMenuSchema,
  instamartProductSearchSchema,
  dineoutSearchSchema,
  dineoutDetailsSchema,
  dineoutSlotsSchema,
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
};
