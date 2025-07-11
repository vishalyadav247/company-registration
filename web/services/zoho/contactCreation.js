import axios from 'axios';
import { getZohoAccessToken } from "./getToken.js";

export async function createZohoContact({ name, gstNumber, mobileNumber, email, address }) {
    const accessToken = await getZohoAccessToken();
    const lname = ""
    const city = "";
    const state = "";
    const country = "";
    const zip = "";

    const zohoContact = {
        "contact_name": name + " " + lname,
        "company_name": name + " " + lname,
        "email": email,
        "phone": mobileNumber,
        "contact_type": "customer",
        "customer_sub_type": "business",
        "billing_address": {
            "attention": name + " " + lname,
            "address": address,
            "street2": "",
            "state_code": "",
            "city": city,
            "state": state,
            "zip": zip,
            "country": country,
            "phone": mobileNumber
        },
        "shipping_address": {
            "attention": name + " " + lname,
            "address": address,
            "street2": "",
            "state_code": "",
            "city": city,
            "state": state,
            "zip": zip,
            "country": country,
            "phone": mobileNumber
        },
        "contact_persons": [
            {
                "first_name": name,
                "last_name": lname,
                "email": email,
                "phone": mobileNumber,
                "mobile": "",
                "is_primary_contact": true,
            }
        ],
        "gst_no": gstNumber
    }

    try {
        const response = await axios.post(
            `https://www.zohoapis.in/inventory/v1/contacts?organization_id=${process.env.ZOHO_ORG_ID}`,
            zohoContact,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );
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
