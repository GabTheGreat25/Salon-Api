const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const deliverySchema = new mongoose.Schema({
    product:{
        type:mongoose.Types.ObjectId,
        required:[true, "Please enter a product"],
        ref: RESOURCE.PRODUCT
    },
    company_name:{
        type:String,
        required:[true, "Please enter company name"],
        maxLength:[60, "Company Name field must not exceed to 60 characters"]
    },
    date:{
        type:Date,
        required:[true, "Please enter a date"],
    },
    price:{
        type:Number,
        required:[true, "Please enter a price"],
        min:0
    },
    status:{
        type:String,
        default:"pending",
        enum:{
            values: ["pending","completed","cancel"]
        }
    },
    quantity:{
        type:Number,
        required:[true, "Quantity field required"],
        maxLength:[8, "Quantity field must not exceed to 8 characters"]
    }
})

module.exports = mongoose.model(RESOURCE.DELIVERY, deliverySchema)