import axios from "axios";
import { getZohoAccessToken } from "./utilityFunctions.js";

export async function deleteZohoProduct({ zoho_item_id }) {

    let accessToken = await getZohoAccessToken();

    try {
        const response = await axios.delete(
            `https://www.zohoapis.in/inventory/v1/items/${zoho_item_id}?organization_id=${process.env.ZOHO_ORG_ID}`,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.code === 0) {
            console.log(response.data.message)
        } else {
            console.error("Error deleting Zoho item:", zoho_item_id);
        }
    } catch (error) {
        console.error("Error in deleteZohoProduct:", error);
    }
};