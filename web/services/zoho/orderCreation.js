import axios from "axios";
const orgId = process.env.ZOHO_ORG_ID;

import { getZohoAccessToken } from "./utilityFunctions.js";
import createZohoInvoice from "./invoiceCreation.js";
import { Product } from "../../models/product/productModels.js";


async function mapLineItems(shopifyLineItems) {
  const result = [];
  for (const item of shopifyLineItems) {
    const dbProduct = await Product.findOne({ sku: item.sku })
    const zohoItemId = dbProduct.zoho_item_id;

    if (!zohoItemId) {
      throw new Error(`No item_id found in app db for SKU: ${item.sku}`);
    }
    result.push({
      item_id: zohoItemId,
      name: item.title,
      description: item.variant_title || item.name,
      rate: Number(item.price) || 0,
      quantity: Number(item.quantity) || 1,
      unit: "qty"
    });
  }
  return result;
}

/**
 * Creates a Zoho sales order using Shopify order data.
 */
export default async function createZohoSalesOrder(shopifyOrder, zohoCustomerId) {
  const accessToken = await getZohoAccessToken();
  // Date in YYYY-MM-DD
  const orderDate = (shopifyOrder.created_at || "").split("T")[0];
  // Map line items
  const lineItems = await mapLineItems(shopifyOrder.line_items);

  // Basic sales order payload
  const payload =
  {
    "customer_id": zohoCustomerId,
    // "salesorder_number": shopifyOrder?.name || String(shopifyOrder.order_number),
    "date": orderDate,
    "reference_number": shopifyOrder?.name || String(shopifyOrder.order_number),
    "line_items": lineItems,
    "notes": shopifyOrder?.notes || '',
    "terms": shopifyOrder?.payment_terms || '',
    "discount": shopifyOrder?.total_discounts || '',
    // "is_discount_before_tax": true,
    // "shipping_charge": 7,
    // "delivery_method": "FedEx",
    // "salesperson_id": 4815000000044762,
    "is_inclusive_tax": shopifyOrder?.taxes_included || true,
    // "billing_address_id": 4815000000017005,
    // "shipping_address_id": 4815000000017005,
    // "place_of_supply": "TN",
    // "gst_treatment": "business_gst",
    // "gst_no": "22AAAAA0000A1Z5"
  }

  try {
    const response = await axios.post(
      `https://www.zohoapis.in/inventory/v1/salesorders?organization_id=${orgId}`,
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (response.data.code === 0) {

      const confirmOrderRes = await fetch(`https://www.zohoapis.in/inventory/v1/salesorders/${response.data.salesorder.salesorder_id}/status/confirmed?organization_id=${orgId}`, {
        method: 'POST',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`
        }
      })

      const confirmOrderData = await confirmOrderRes.json()

      const freshOrderRes = await fetch(`https://www.zohoapis.in/inventory/v1/salesorders/${response.data.salesorder.salesorder_id}?organization_id=${orgId}`, {
        method: 'GET',
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`
        }
      })

      const freshOrderData = await freshOrderRes.json();
      console.log(response.data.message + " & " + confirmOrderData.message)
      return freshOrderData;
    } else {
      console.error("Error creating Zoho Sales Order:", response.data.message);
      return null;
    }
  } catch (error) {
    console.error("Error in createZohoSalesOrder:", error?.response?.data || error.message);
    return null;
  }
}
