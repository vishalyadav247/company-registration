import axios from "axios";
import { getZohoAccessToken } from "./getToken.js";

export async function createZohoProduct({ productNode, variant }) {

    let accessToken = await getZohoAccessToken();

    const buildZohoProductPayload = (productNode, variant) => {
        // Map Shopify options/selectedOptions for attributes
        // (Assuming first option is attribute_name1, etc.)
        const attributeName1 = productNode.options && productNode.options.length > 0
            ? productNode.options[0].name
            : null;
        const attributeOptionName1 = variant.selectedOptions && variant.selectedOptions.length > 0
            ? variant.selectedOptions[0].value
            : null;

        // Use the first product image as document if needed (needs upload to Zoho, not just the URL)
        // For now, we leave "documents" as empty or filled after upload logic.
        const documents = [];

        // --- Build the Zoho product payload ---
        const zohoProduct = {
            group_name: productNode.productType || "Default",
            unit: "qty",
            documents,
            item_type: "inventory",
            product_type: "goods",
            attribute_name1: attributeName1,
            name: `${productNode.title}${variant.title ? ` - ${variant.title}` : ""}`,
            rate: Number(variant.price) || 0,
            purchase_rate: Number(variant.price) || 0,
            vendor_name: productNode.vendor || "Unknown",
            sku: variant.sku || "",
        };

        return zohoProduct;
    };

    const zohoProduct = buildZohoProductPayload(productNode, variant);

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