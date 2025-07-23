import axios from 'axios';

import { getZohoAccessToken } from "./utilityFunctions.js";

export async function createZohoContact(contact) {
    const accessToken = await getZohoAccessToken();

    const address = {
        "attention": `${contact.first_name} ${contact.last_name || ""}`.trim(),
        "address": contact.address || "",
        "street2": contact.street2 || "",
        "city": contact.city || "",
        "state": contact.state || "",
        "zip": contact.zip || "",
        "country": contact.country || "",
        "phone": contact.phone || ""
    }

    const payload = {
        "contact_name": `${contact.first_name} ${contact.last_name || ""}`.trim(),
        "company_name": `${contact.first_name} ${contact.last_name || ""}`.trim(),
        "currency_id": "2491591000000000064",
        "email": contact.email || "",
        "phone": contact.phone || "",
        "contact_type": "customer",
        "customer_sub_type": "business",
        "billing_address": address,
        "shipping_address": contact.gst_number ? "" : address,
        "contact_persons": [
            {
                "first_name": contact.first_name,
                "last_name": contact.last_name || "",
                "email": contact.email || "",
                "mobile": contact.phone || "",
                "is_primary_contact": true,
            }
        ],
        "language_code": "en",
        "country_code": contact.country_code || "",
        "place_of_contact": contact.state_code || "",
        "gst_no": contact.gst_number || "",
        "gst_treatment": contact.gst_number ? "business_gst" : "consumer",
    }

    try {
        const response = await axios.post(
            `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${process.env.ZOHO_ORG_ID}`,
            payload,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
        console.log(response.data.message)
        return response.data;
    } catch (error) {
        if (error.response) {
            console.error('Zoho API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('No response received from Zoho:', error.request);
        } else {
            console.error('Error in request setup:', error.message);
        }
        throw error;
    }
}
