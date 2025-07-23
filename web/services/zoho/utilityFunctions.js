import axios from "axios";
import { redisClient } from '../cache/redis.js';

const ZOHO_TOKEN_KEY = 'zoho:access_token';

// zoho access token
export async function getZohoAccessToken() {

  const url = "https://accounts.zoho.in/oauth/v2/token";
  let accessToken = await redisClient.get(ZOHO_TOKEN_KEY);
  // console.log('access token cache', accessToken)
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
  // console.log('new generated token', accessToken)

  // Cache the token in Redis (expires 60s before actual expiry)
  await redisClient.set(ZOHO_TOKEN_KEY, accessToken);
  await redisClient.expire(ZOHO_TOKEN_KEY, expiresIn - 60);
  return accessToken;
}

export async function updateShippingAddress(contact, customer_id) {

  let accessToken = await getZohoAccessToken();

  const payload = {
    "contact_name": `${contact.first_name} ${contact.last_name || ""}`.trim(),
    "shipping_address": {
      "attention": `${contact.shipping_first_name} ${contact.shipping_last_name || ""}`.trim(),
      "address": contact.address || "",
      "street2": contact.street2 || "",
      "city": contact.city || "",
      "state": contact.state || "",
      "zip": contact.zip || "",
      "country": contact.country || "",
      "phone": contact.phone || ""
    }
  }

  try {
    let response = await axios.put(`https://www.zohoapis.in/inventory/v1/contacts/${customer_id}?organization_id=${process.env.ZOHO_ORG_ID}`,
      payload,
      {
        headers: {
          Authorization: `Zoho-oauthtoken ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    )
    if (response.status === 200) {
      console.log(response.data.message)
      return true;
    } else {
      console.error("Error updating Zoho contact:", response.data.message);
      return false;
    }

  } catch (error) {
    console.log('error in updating shipping address', error)
  }
}
