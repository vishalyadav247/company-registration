import axios from "axios";
import { getZohoAccessToken } from "./utilityFunctions.js";

export async function updateZohoProduct(shopifyProduct, shopifyVariant, zoho_item_id) {

    let accessToken = await getZohoAccessToken();

    // --- Build the Zoho product payload ---
    const documents = [];

    const attributeName1 = shopifyProduct.options && shopifyProduct.options.length > 0
        ? shopifyProduct.options[0].name
        : null;

    const payload = {
        group_name: shopifyProduct.productType || "Default",
        unit: "qty",
        documents,
        item_type: "inventory",
        product_type: "goods",
        is_taxable: shopifyVariant.taxable,
        attribute_name1: attributeName1,
        name: `${shopifyProduct.title}${shopifyVariant.title ? ` - ${shopifyVariant.title}` : ""}`,
        rate: Number(shopifyVariant.price) || 0,
        purchase_rate: Number(shopifyVariant.price) || 0,
        vendor_name: shopifyProduct.vendor || "Unknown",
        sku: shopifyVariant.sku || "",
    };

    try {
        const response = await axios.put(
            `https://www.zohoapis.in/inventory/v1/items/${zoho_item_id}?organization_id=${process.env.ZOHO_ORG_ID}`,
            payload,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.code === 0) {
            console.log(response.data.message)
            return true;
        } else {
            console.error("Error updating Zoho product:", response.data.message);
        }
    } catch (error) {
        console.error("Error in updateZohoProduct:", error);
    }
};