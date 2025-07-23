import { DeliveryMethod } from "@shopify/shopify-api";
import delay from "delay";

import { Customer } from "../../models/customer/customerModel.js";
import { Product } from "../../models/product/productModels.js";
import createZohoSalesOrder from "../zoho/orderCreation.js";
import createZohoInvoice from "../zoho/invoiceCreation.js";
import { createZohoContact } from "../zoho/contactCreation.js";
import { createZohoProduct } from "../zoho/productCreation.js";
import { updateZohoProduct } from "../zoho/productUpdate.js";
import { deleteZohoProduct } from "../zoho/productDeletion.js"
import { updateShippingAddress } from "../zoho/utilityFunctions.js";

const ZOHO_VARIANT_SYNC_DELAY_MS = 350;

/**
 * @type {{[key: string]: import("@shopify/shopify-api").WebhookHandler}}
 */
export default {
  PRODUCTS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const shopifyProduct = JSON.parse(body);

      if (shopifyProduct) {
        for (const shopifyVariant of shopifyProduct.variants) {

          try {
            const itemExists = await Product.find({ shopify_variant_id: shopifyVariant.id });
            if (!itemExists) {
              const zoho_item_id = await createZohoProduct({ shopifyProduct, shopifyVariant });
              if (zoho_item_id) {
                const newProduct = new Product({
                  shop: shop,
                  shopify_product_id: shopifyProduct.id,
                  shopify_variant_id: shopifyVariant.id,
                  sku: shopifyVariant.sku,
                  zoho_item_id: zoho_item_id,
                  last_synced_at: new Date().toISOString()
                });
                await newProduct.save();
              }
            }
          } catch (error) {
            console.log('error creating item in zoho', error)
          }
          await delay(ZOHO_VARIANT_SYNC_DELAY_MS);
        }
      }
    },
  },
  PRODUCTS_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const shopifyProduct = JSON.parse(body);
      // Your logic for handling product update
      if (shopifyProduct) {

        // Loop through variants for each product
        for (const shopifyVariant of shopifyProduct.variants) {

          try {
            const itemExists = await Product.findOne({ shopify_variant_id: shopifyVariant.id });
            if (!itemExists) {
              const zoho_item_id = await createZohoProduct(shopifyProduct, shopifyVariant);
              if (zoho_item_id) {
                const newProduct = new Product({
                  shop: shop,
                  shopify_product_id: shopifyProduct.id,
                  shopify_variant_id: shopifyVariant.id,
                  sku: shopifyVariant.sku,
                  zoho_item_id: zoho_item_id,
                  last_synced_at: new Date().toISOString()
                });
                await newProduct.save();
              }
            } else {
              const zoho_item_id = itemExists.zoho_item_id;
              const result = await updateZohoProduct(shopifyProduct, shopifyVariant, zoho_item_id)
              if (result) {
                await Product.updateOne(
                  {
                    shop,
                    shopify_product_id: shopifyProduct.id,
                    shopify_variant_id: shopifyVariant.id,
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
            console.error(`Zoho product updation failed for ${shopifyProduct.title} [${shopifyVariant.sku}]:`, err?.message ?? err);
          }

          await delay(ZOHO_VARIANT_SYNC_DELAY_MS);

        }
      }
    },
  },
  PRODUCTS_DELETE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const shopifyProduct = JSON.parse(body);
      if (shopifyProduct) {
        try {
          const totalItems = await Product.find({ shopify_product_id: shopifyProduct.id });
          // Loop through variants for each product
          for (const item of totalItems) {
            const zoho_item_id = item.zoho_item_id;
            if (zoho_item_id) {
              await deleteZohoProduct({ zoho_item_id });
              await Product.deleteOne({ zoho_item_id: zoho_item_id })
            }
          }

        } catch (err) {
          console.error(`Zoho product deletion failed for ${shopifyProduct.title} [${shopifyVariant.sku}]:`, err?.message ?? err);
        }

        await delay(ZOHO_VARIANT_SYNC_DELAY_MS);

      }

    },
  },
  ORDERS_CREATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {

      const shopifyOrder = JSON.parse(body);
      const email = shopifyOrder.email || shopifyOrder.customer?.email;
      let existingContact = await Customer.findOne({ email: email });
      let zohoCustomerId = existingContact?.customer_id || null;

      if (!zohoCustomerId) {
        try {
          const contact = {
            first_name: shopifyOrder.billing_address.first_name,
            last_name: shopifyOrder.billing_address.last_name,
            email: shopifyOrder.email,
            phone: '',
            address: shopifyOrder.billing_address.address1,
            street2: shopifyOrder.billing_address.address2,
            city: shopifyOrder.billing_address.city,
            state: shopifyOrder.billing_address.province,
            state_code: shopifyOrder.billing_address.province_code,
            zip: shopifyOrder.billing_address.zip,
            country: shopifyOrder.billing_address.country,
            country_code: shopifyOrder.billing_address.country_code,
            gst_number: ''
          }
          const response = await createZohoContact(contact)
          const soResponse = await createZohoSalesOrder(shopifyOrder, response.contact.contact_id);
          await createZohoInvoice(soResponse.salesorder)

        } catch (error) {
          console.log('error creating guest customer in zoho')
        }
      } else {
        try {
          const contact = {
            first_name: existingContact?.first_name,
            last_name: existingContact.last_name || '',
            address: shopifyOrder.billing_address.address1,
            street2: shopifyOrder.billing_address.address2,
            city: shopifyOrder.billing_address.city,
            state: shopifyOrder.billing_address.province,
            zip: shopifyOrder.billing_address.zip,
            country: shopifyOrder.billing_address.country,
            shipping_first_name: shopifyOrder.billing_address.first_name,
            shipping_last_name: shopifyOrder.billing_address.last_name
          }
          const result = await updateShippingAddress(contact, zohoCustomerId);
          if (result) {
            const response = await createZohoSalesOrder(shopifyOrder, zohoCustomerId);
            await createZohoInvoice(response.salesorder)
          }
        } catch (err) {
          console.error('Zoho Sales Order error:', err);
        }
      }
    },
  },
}