export const swiggyFoodTools = [
  {
    name: 'get_addresses',
    description: 'Get all saved delivery addresses for the authenticated Swiggy user, sorted by last order date. Use this to find the user\'s addressId. Returns label, addressId, and display text.',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'search_restaurants',
    description: 'Search and order food from restaurants for delivery. Use this when the user wants to order food or search restaurants. Returns restaurants with availabilityStatus.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string', description: 'The delivery address ID obtained from get_addresses.' },
        query: { type: 'string', description: 'The food or restaurant to search for.' }
      },
      required: ['addressId', 'query']
    }
  },
  {
    name: 'get_restaurant_menu',
    description: 'Get the complete menu of a restaurant. Use this to BROWSE a restaurant menu and see what is available.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string', description: 'The delivery address ID.' },
        restaurantId: { type: 'string', description: 'The restaurant ID obtained from search_restaurants.' }
      },
      required: ['addressId', 'restaurantId']
    }
  },
  {
    name: 'update_food_cart',
    description: 'Add items to food delivery cart or update cart contents. Supports adding variants and add-ons.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string', description: 'The delivery address ID.' },
        items: {
          type: 'array',
          description: 'List of items to add to cart.',
          items: {
            type: 'object',
            properties: {
              itemId: { type: 'string', description: 'The ID of the menu item.' },
              quantity: { type: 'number', description: 'Quantity to add.' },
              restaurantId: { type: 'string', description: 'The restaurant ID.' },
              addons: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    groupId: { type: 'string' },
                    addonId: { type: 'string' }
                  }
                }
              },
              variants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    groupId: { type: 'string' },
                    variationId: { type: 'string' }
                  }
                }
              }
            },
            required: ['itemId', 'quantity', 'restaurantId']
          }
        }
      },
      required: ['addressId', 'items']
    }
  },
  {
    name: 'get_food_cart',
    description: 'Get current food delivery cart with all items and bill breakdown.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string' }
      },
      required: ['addressId']
    }
  },
  {
    name: 'fetch_food_coupons',
    description: 'Get available coupons and offers for food delivery order.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string' }
      },
      required: ['addressId']
    }
  },
  {
    name: 'apply_food_coupon',
    description: 'Apply coupon code or discount to food delivery order.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string' },
        couponCode: { type: 'string' }
      },
      required: ['addressId', 'couponCode']
    }
  },
  {
    name: 'place_food_order',
    description: 'Place food delivery order and confirm order placement. VERY IMPORTANT: place_food_order is not idempotent. If it fails with 5xx, call get_food_orders to check if the order actually placed before retrying.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string' }
      },
      required: ['addressId']
    }
  },
  {
    name: 'track_food_order',
    description: 'Track food delivery order status and delivery progress.',
    parameters: {
      type: 'object',
      properties: {
        orderId: { type: 'string' }
      },
      required: ['orderId']
    }
  },
  {
    name: 'get_food_orders',
    description: 'Get active food delivery orders and order status. Returns active and past food orders. Use this to fetch the user\'s past food orders.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string', description: 'The delivery address ID obtained from get_addresses.' }
      },
      required: ['addressId']
    }
  },
  {
    name: 'search_products',
    description: 'Search for products available at the selected address on Swiggy Instamart (Grocery). Use this to find local specialties on Instamart.',
    parameters: {
      type: 'object',
      properties: {
        addressId: { type: 'string', description: 'The delivery address ID.' },
        query: { type: 'string', description: 'The product to search for.' }
      },
      required: ['addressId', 'query']
    }
  },
  {
    name: 'get_orders',
    description: 'Get past Instamart (Grocery) orders. Use this to fetch the user\'s past grocery orders.',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
];
