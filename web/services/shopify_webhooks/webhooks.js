import { DeliveryMethod } from "@shopify/shopify-api";
/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {
  PRODUCTS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const product = JSON.parse(body);
      // Your logic for handling product update
      console.log('Product updated in shop:', shop, product);
    },
  },
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const order = JSON.parse(body);
      // Your logic for handling order create
      console.log('Order created in shop:', shop, order);
    },
  },
}