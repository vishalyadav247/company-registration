import mongoose from "mongoose";
const {Schema} = mongoose;

const productSchema = new Schema({
    shop:{
        type:String,
        required:true,
        index:true
    },
    shopifyId:{
        type:String,
        required:true
    },
    title: {
        type: String,
        required: true
    }
})

const companySchema = new mongoose.Schema(
    {   
        shop:{
            type:String,
            required:true,
            index:true
        },
        name: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        gstNumber: {
            type: String,
        },
        mobileNumber: {
            type: String,
        },
        email: {
            type: String,
            required:true,
            unique: true,
        },
        zohoContactStatus: {
            type: String
        }
    },
    {timestamps:true}
)

const Product = mongoose.model("Shopify Product",productSchema);
const Company = mongoose.model('Company',companySchema)

export {Product,Company};
