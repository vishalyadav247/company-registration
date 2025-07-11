import mongoose from "mongoose";
const {Schema} = mongoose;

const productSchema = new Schema({
    shop:{
        type:String,
        required:true,
        index:true
    },
    sku:{
        type:String,
        required:true
    },
    shopify_product_id:{
        type:String,
        required:true
    },
    shopify_variant_id: {
        type: String,
        required: true
    },
    zoho_item_id: {
        type: String,
        required: true
    },
    last_synced_at: {
        type: String,
        required: true
    }
})

const Product = mongoose.model("Product",productSchema);

export {Product};
