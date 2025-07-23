import axios from "axios";
import delay from 'delay';

import { Product } from "../../models/product/productModels.js";
import { createZohoProduct } from "../../services/zoho/productCreation.js";
import { updateZohoProduct } from "../../services/zoho/productUpdate.js";

const ZOHO_VARIANT_SYNC_DELAY_MS = 350;

const syncProducts = async (_req, res) => {
  let cursor = null;
  const shop = res.locals.shopify.session.shop; // Store domain
  const accessToken = res.locals.shopify.session.accessToken; // Auth token

  try {
    let productsData = [];
    const shopifyApiUrl = `https://${shop}/admin/api/unstable/graphql.json`;

    const query = `
      query getProducts($cursor: String) {
        products(first: 100, after: $cursor) {
          edges {
            node {
              id
              title
              handle
              productType
              vendor
              options(first: 3) {
                name
                values
              }
              images(first: 5) {
                nodes {
                  id
                  src
                  altText
                }
              }
              variants(first: 100) {
                nodes {
                  id
                  title
                  sku
                  price
                  taxable
                  selectedOptions {
                    name
                    value
                  }
                  image {
                    id
                    src
                    altText
                  }
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;

    let hasNextPage = true;

    while (hasNextPage) {
      const response = await axios.post(
        shopifyApiUrl,
        { query, variables: { cursor } },
        {
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
        }
      );


      productsData = response.data.data.products;

      if (productsData.edges.length > 0) {
        for (const edge of productsData.edges) {
          const shopifyProduct = edge.node;

          // Loop through variants for each product
          for (const shopifyVariant of shopifyProduct.variants.nodes) {

            try {

              const itemExists = await Product.findOne({ shopify_variant_id: shopifyVariant.id.split('/').pop() });
              if (!itemExists) {
                const zoho_item_id = await createZohoProduct(shopifyProduct, shopifyVariant);
                if (zoho_item_id) {
                  const newProduct = new Product({
                    shop: shop,
                    shopify_product_id: shopifyProduct.id.split('/').pop(),
                    shopify_variant_id: shopifyVariant.id.split('/').pop(),
                    sku: shopifyVariant.sku,
                    zoho_item_id: zoho_item_id,
                    last_synced_at: new Date().toISOString()
                  });
                  await newProduct.save();
                }
              } else {
                const zoho_item_id = itemExists.zoho_item_id;
                const result = await updateZohoProduct(shopifyProduct, shopifyVariant, zoho_item_id);
                if (result) {
                  await Product.updateOne(
                    {
                      shop,
                      shopify_product_id: shopifyProduct.id.split('/').pop(),
                      shopify_variant_id: shopifyVariant.id.split('/').pop(),
                    },
                    {
                      $set: {
                        sku: shopifyVariant.sku,
                        last_synced_at: new Date().toISOString()
                      },
                      $setOnInsert: { shop },
                    },
                    { upsert: true }
                  );
                }
              }
            } catch (err) {
              console.error(`Zoho sync failed for ${shopifyProduct.title} [${shopifyVariant.sku}]:`, err?.message ?? err);
            }
            await delay(ZOHO_VARIANT_SYNC_DELAY_MS);
          }
        }
      }

      hasNextPage = productsData.pageInfo.hasNextPage;
      cursor = productsData.pageInfo.endCursor;
    }
    res.status(200).send({ message: "All Products Successfully Synced to zoho." });
  } catch (error) {
    console.error("Error fetching and syncing products:", error);
    res.status(500).send("Error fetching & syncing products");
  }
};


const productCount = async (req, res) => {
  const shop = req.body.shop;
  try {
    const response = await Product.countDocuments({ shop: shop })
    res.status(200).send({ productCount: response })
  } catch (error) {
    console.log(error)
  }
}

export { syncProducts, productCount };
