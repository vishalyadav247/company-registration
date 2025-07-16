import { DeliveryMethod } from "@shopify/shopify-api";

import createZohoSalesOrder from "../zoho/orderCreation.js";
import { getZohoCustomerIdByEmail } from "../zoho/utilityFunctions.js";

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
      console.log('Product updated in shop:');
    },
  },
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const order = JSON.parse(body);
      const email = order.email || order.customer?.email;
      let zohoCustomerId = await getZohoCustomerIdByEmail(email);
      // If not found, call your Zoho customer creation logic here and get the new ID
      console.log('customer id for order',zohoCustomerId)
      if (!zohoCustomerId) {
        console.error("Zoho customer not found for email:", email);
        return;
      }
      try {
        await createZohoSalesOrder(order, zohoCustomerId);
        console.log('Successfully created Zoho Sales Order');
      } catch (err) {
        console.error('Zoho Sales Order error:', err);
      }
    },
  },
}