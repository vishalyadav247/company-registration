import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { MongoDBSessionStorage } from "@shopify/shopify-app-session-storage-mongodb";
import { restResources } from "@shopify/shopify-api/rest/admin/2025-04";
import "dotenv/config";

import AdditionalWebhookHandelers from './services/webhooks/shopify_webhooks.js'

const DB_PATH = process.env.DB_URI;

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    future: {
      customerAddressDefaultFix: true,
      lineItemBilling: true,
      unstable_managedPricingSupport: true,
    },
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new MongoDBSessionStorage(DB_PATH),
  // 👇 Add afterAuth here!
  afterAuth: async ({ session, shop, accessToken, res, req }) => {
    
    try {
      // Register single webhook here
      
      // const regResult = await shopify.webhooks.register({
      //   session,
      //   path: shopify.config.webhooks.path,
      //   topic: 'PRODUCTS_UPDATE',
      //   webhookHandler: AdditionalWebhookHandelers.PRODUCTS_UPDATE.callback,
      // });

      // register all handlers in one loop
      for (const [topic, handler] of Object.entries(AdditionalWebhookHandelers)) {
        let regResult = await shopify.webhooks.register({
          session,
          path: shopify.config.webhooks.path,
          topic,
          webhookHandler: handler.callback,
        });
        console.log('Webhook registration result:', regResult);
      }
      
    } catch (err) {
      console.error('Webhook registration failed:', err);
    }
    // Optionally, redirect if you want to customize the post-auth behavior
    // res.redirect(`/your-app-path?shop=${shop}`);
  },
});

export default shopify;
