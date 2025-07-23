const orgId = process.env.ZOHO_ORG_ID;
import axios from 'axios';

import { getZohoAccessToken } from "./utilityFunctions.js";

export default async function createZohoInvoice(salesOrder) {
    const accessToken = await getZohoAccessToken();

    function payload() {
        const so = salesOrder;
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
                location_id: item.location_id
            }
        })

        const payload = {
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
            location_id: so.location_id
        }
        return payload;
    }


    try {
        const response = await axios.post(
            `https://www.zohoapis.in/inventory/v1/invoices?organization_id=${orgId}`,
            payload(),
            {
                headers: {
                    Authorization: `Zoho-oauthtoken ${accessToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (response.data.code === 0) {
            console.log(response.data.message)
            return null;
        } else {
            console.error("Error creating Zoho Invoice:", response.data.message);
            return null;
        }
    } catch (error) {
        console.error("Error in createZohoInvoice:", error?.response?.data || error.message);
        return null;
    }
}