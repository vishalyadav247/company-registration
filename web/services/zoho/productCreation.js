import axios from "axios";
import { getZohoAccessToken } from "./utilityFunctions.js";

export async function createZohoProduct({ shopifyProduct, shopifyVariant }) {

    let accessToken = await getZohoAccessToken();

    const buildZohoProductPayload = (shopifyProduct, shopifyVariant) => {
        // Map Shopify options/selectedOptions for attributes
        // (Assuming first option is attribute_name1, etc.)
        const attributeName1 = shopifyProduct.options && shopifyProduct.options.length > 0
            ? shopifyProduct.options[0].name
            : null;
        const attributeOptionName1 = shopifyVariant.selectedOptions && shopifyVariant.selectedOptions.length > 0
            ? shopifyVariant.selectedOptions[0].value
            : null;

        // Use the first product image as document if needed (needs upload to Zoho, not just the URL)
        // For now, we leave "documents" as empty or filled after upload logic.
        const documents = [];

        // --- Build the Zoho product payload ---
        const zohoProduct = {
            group_name: shopifyProduct.productType || "Default",
            unit: "qty",
            documents,
            item_type: "inventory",
            product_type: "goods",
            attribute_name1: attributeName1,
            name: `${shopifyProduct.title}${shopifyVariant.title ? ` - ${shopifyVariant.title}` : ""}`,
            rate: Number(shopifyVariant.price) || 0,
            purchase_rate: Number(shopifyVariant.price) || 0,
            vendor_name: shopifyProduct.vendor || "Unknown",
            sku: shopifyVariant.sku || "",
        };

        return zohoProduct;
    };

    const zohoProduct = buildZohoProductPayload(shopifyProduct, shopifyVariant);

    try {
        const response = await axios.post(
            `https://www.zohoapis.in/inventory/v1/items?organization_id=${process.env.ZOHO_ORG_ID}`,
            zohoProduct,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.code === 0) {
            // Successfully created product in Zoho
            const zohoItemId = response.data.item.item_id;
            return zohoItemId;
        } else {
            console.error("Error creating Zoho product:", response.data.message);
        }
    } catch (error) {
        console.error("Error in createZohoProduct:", error);
    }
};