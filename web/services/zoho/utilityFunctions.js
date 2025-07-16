import axios from "axios";
import { redisClient } from '../cache/redis.js';

const orgId = process.env.ZOHO_ORG_ID;
const ZOHO_TOKEN_KEY = 'zoho:access_token';

export async function getZohoAccessToken() {

    const url = "https://accounts.zoho.in/oauth/v2/token";
    let accessToken = await redisClient.get(ZOHO_TOKEN_KEY);
    console.log('access token cache', accessToken)
    if (accessToken) {
        return accessToken;
    }

    // Fetch new token from Zoho
    const params = new URLSearchParams();
    params.append('refresh_token', process.env.ZOHO_REFRESH_TOKEN);
    params.append('client_id', process.env.ZOHO_CLIENT_ID);
    params.append('client_secret', process.env.ZOHO_CLIENT_SECRET);
    params.append('grant_type', 'refresh_token');
    
    const response = await axios.post(url, params);
    accessToken = response.data.access_token;

    const expiresIn = response.data.expires_in || 3600;
    console.log('new generated token', accessToken)
    // Cache the token in Redis (expires 60s before actual expiry)
    await redisClient.set(ZOHO_TOKEN_KEY, accessToken);
    await redisClient.expire(ZOHO_TOKEN_KEY, expiresIn - 60);
    return accessToken;
}

export async function getZohoCustomerIdByEmail(email) {

    const accessToken = await getZohoAccessToken();
    const url = `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${orgId}&email=${encodeURIComponent(email)}`;

    try {
        const res = await axios.get(url, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`
            }
        });

        // Check if any contacts found
        const contacts = res.data.contacts;
        if (contacts && contacts.length > 0) {
            // Return the first match's contact_id
            return contacts[0].contact_id;
        } else {
            return null; // Not found
        }
    } catch (err) {
        console.error("Error searching Zoho contacts:", err?.response?.data || err.message);
        throw err;
    }
}

export async function getZohoItemIdBySKU(sku) {

    const accessToken = await getZohoAccessToken();
    const url = `https://www.zohoapis.in/inventory/v1/items?organization_id=${orgId}&sku=${encodeURIComponent(sku)}`;

    try {
        const res = await axios.get(url, {
            headers: { Authorization: `Zoho-oauthtoken ${accessToken}` }
        });
        const items = res.data.items;
        if (items && items.length > 0) {
            return items[0].item_id;
        }
        return null;
    } catch (err) {
        console.error("Error fetching Zoho item by SKU:", err?.response?.data || err.message);
        return null;
    }
}

export async function createZohoInvoice(salesOrderResp) {
  const accessToken = await getZohoAccessToken();

  function mapSalesOrderToInvoicePayload() {
    const so = salesOrderResp.salesorder;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const dueDate = today; // Or calculate +15 days etc.

    const line_items = so.line_items.map((item) => {
      return {
        item_id: item.item_id,
        salesorder_item_id: item.line_item_id,
        rate: item.rate,
        quantity: item.quantity,// must match SO
        name: item.name,
        description: item.description,
        unit: item.unit,
        tax_id: item.tax_id,
        tax_name: item.tax_name,
        tax_type: item.tax_type,
        tax_percentage: item.tax_percentage,
        item_total: item.item_total,
        hsn_or_sac: item.hsn_or_sac || "",
        location_id:item.location_id
      }
    })

    const invoicePayload = {
      customer_id: so.customer_id,
      reference_number: so.reference_number,
      date: so.date,
      due_date: so.date, // or add payment terms logic
      discount: so.discount,
      is_discount_before_tax: so.is_discount_before_tax,
      discount_type: so.discount_type,
      is_inclusive_tax: so.is_inclusive_tax,
      notes: so.notes,
      terms: so.terms,
      shipping_charge: so.shipping_charge,
      adjustment: so.adjustment,
      adjustment_description: so.adjustment_description,
      gst_no: so.gst_no,
      gst_treatment: so.gst_treatment,
      place_of_supply: so.place_of_supply,
      billing_address_id: so.billing_address_id,
      shipping_address_id: so.shipping_address_id,
      line_items: line_items,
      location_id:so.location_id
    }
    // console.log('invoicepayload',invoicePayload)
    return invoicePayload;
  }


  try {
    const response = await axios.post(
      `https://www.zohoapis.in/inventory/v1/invoices?organization_id=${orgId}`,
      mapSalesOrderToInvoicePayload(),
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log('inv res', response.data)

    if (response.data.code === 0) {
      return response.data.invoice.invoice_id;
    } else {
      console.error("Error creating Zoho Invoice:", response.data.message);
      return null;
    }
  } catch (error) {
    console.error("Error in createZohoInvoice:", error?.response?.data || error.message);
    return null;
  }
}
