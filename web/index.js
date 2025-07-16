// @ts-check
import express from "express";
import serveStatic from "serve-static";
import { join } from "path";
import { readFileSync } from "fs";

import shopify from "./shopify.js";
import {connectDB} from "./config/db.js";
import customerRoutes from "./routes/customerRoutes.js";
import { connectRedis } from "./services/cache/redis.js";
import PrivacyWebhookHandlers from "./privacy.js";
import AdditionalWebhookHandelers from "./services/webhooks/shopify_webhooks.js"
import { productCount, syncProducts } from "./controllers/product/productControllers.js";

const CombinedWebhookHandlers = {
  ...PrivacyWebhookHandlers,...AdditionalWebhookHandelers
}

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling setup
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: CombinedWebhookHandlers })
);

app.use(express.json());
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/customers", customerRoutes);
app.use("/api/*", shopify.validateAuthenticatedSession());
app.get("/api/sync-products", syncProducts);
app.post("/api/product-count", productCount);

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

// start server
(async () => {
  try {
    await connectDB();
    await connectRedis(); 
    app.listen(PORT,async()=>{
      console.log(`server running on port ${PORT}`)
    });

  } catch (err) {
    console.error('Error during startup:', err);
    // Optionally process.exit(1) if this is a fatal connection error
  }
})();
