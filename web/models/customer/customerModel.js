import mongoose from "mongoose";
const {Schema} = mongoose;

const customerSchema = new mongoose.Schema( 
    {   
        shop:{
            type:String,
            required:true,
            index:true
        },
        first_name: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            required:true,
            unique: true,
        },
        phone: {
            type: String,
        },
        address: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        zip: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true
        },
        gst_number: {
            type: String,
        },
        zohoContactStatus: {
            type: String
        },
        customer_id:{
            type:String
        }
    },
    {timestamps:true}
)

const Customer = mongoose.model('Customer',customerSchema)

export {Customer};
