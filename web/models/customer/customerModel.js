import mongoose from "mongoose";
const {Schema} = mongoose;

const customerSchema = new mongoose.Schema( 
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

const Customer = mongoose.model('Customer',customerSchema)

export {Customer};
