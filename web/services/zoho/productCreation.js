import axios from "axios";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import FormData from "form-data";

import { getZohoAccessToken } from "./utilityFunctions.js";

// === Use a dedicated project temp directory ===
const TEMP_DIR = path.join(process.cwd(), "temp_images");
if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Helper: Download image and save as temp file
async function downloadImage(url, filePath) {
    try {
        const response = await axios.get(url, { responseType: "stream" });
        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
        return true;
    } catch (err) {
        console.error("Failed to download image:", err.message, url);
        return false;
    }
}

export async function createZohoProduct(shopifyProduct, shopifyVariant) {

    const accessToken = await getZohoAccessToken();

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
        const response = await axios.post(
            `https://www.zohoapis.in/inventory/v1/items?organization_id=${process.env.ZOHO_ORG_ID}`,
            payload,
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.code !== 0) {
            console.error("Error creating Zoho product:", response.data.message);
            return null;
        }

        const zohoItemId = response.data.item.item_id;
        console.log(response.data.message);

        // 2. Download Shopify image (first image)
        const imageUrl =
            shopifyProduct?.images?.nodes?.[0]?.src ||
            shopifyVariant?.image?.src ||
            null;
        if (!imageUrl) {
            console.warn("No image found for Shopify product:", shopifyProduct.id);
            return zohoItemId;
        }

        // Save image temporarily in our dedicated dir
        const fileExt = path.extname(imageUrl).split("?")[0] || ".jpg";
        const tempImagePath = path.join(TEMP_DIR, `shopify-prod-${zohoItemId}${fileExt}`);
        const success = await downloadImage(imageUrl, tempImagePath);

        if (!success) {
            console.warn("Image download failed, skipping upload for:", imageUrl);
            return zohoItemId;
        }

        let finalImagePath = tempImagePath;

        // Convert .webp to .jpg if needed
        if (fileExt.toLowerCase() === ".webp") {
            const jpgImagePath = tempImagePath.replace(/\.webp$/, ".jpg");
            try {
                await sharp(tempImagePath).jpeg().toFile(jpgImagePath);
                finalImagePath = jpgImagePath;
            } catch (e) {
                console.error("Failed to convert webp to jpg:", e.message);
                // Clean up downloaded .webp
                fs.unlink(tempImagePath, () => { });
                return zohoItemId;
            }
        }

        try {
            // 3. Upload to Zoho (assign to this item)
            const form = new FormData();
            form.append("image", fs.createReadStream(finalImagePath));
            await axios.post(
                `https://www.zohoapis.in/inventory/v1/items/${zohoItemId}/image?organization_id=${process.env.ZOHO_ORG_ID}`,
                form,
                {
                    headers: {
                        ...form.getHeaders(),
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                    },
                }
            );
            console.log("Image uploaded for item", zohoItemId);
        } catch (err) {
            console.error("Zoho image upload failed:", err.message);
        } 
        // finally {
        //     // Clean up all temp files (.webp and .jpg if present)
        //     [tempImagePath, finalImagePath].forEach(p => {
        //         if (fs.existsSync(p)) {
        //             setTimeout(() => {
        //                 fs.unlink(p, (err) => {
        //                     if (err) console.error("Failed to delete temp image:", err);
        //                 });
        //             }, 1000);
        //         }
        //     });
        // }
        // try {
        //     const form = new FormData();
        //     const stream = fs.createReadStream(finalImagePath);
        //     form.append("image", stream);
        //     await axios.post(
        //         `https://www.zohoapis.in/inventory/v1/items/${zohoItemId}/image?organization_id=${process.env.ZOHO_ORG_ID}`,
        //         form,
        //         {
        //             headers: {
        //                 ...form.getHeaders(),
        //                 Authorization: `Zoho-oauthtoken ${accessToken}`,
        //             },
        //         }
        //     );
        //     console.log("Image uploaded for item", zohoItemId);
        //     await new Promise(resolve => stream.on('close', resolve)); // <- Wait for stream close!
        // } catch (err) {
        //     console.error("Zoho image upload failed:", err.message);
        // } finally {
        //     [tempImagePath, finalImagePath].forEach(p => {
        //         if (fs.existsSync(p)) {
        //             fs.unlink(p, (err) => {
        //                 if (err) console.error("Failed to delete temp image:", err);
        //             });
        //         }
        //     });
        // }


        return zohoItemId;
    } catch (error) {
        console.error("Error in createZohoProduct:", error);
    }
};