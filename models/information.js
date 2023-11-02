const mongoose = require("mongoose");
const {
    RESOURCE
} = require("../constants/index");

const informationSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a customer"],
        ref: RESOURCE.USER
    },
    allergy: [{
        type: String,
        required: false,
    }],
    product_preference: [{
        type: String,
        required: false,
    }],
})

module.exports = mongoose.model(RESOURCE.INFORMATION, informationSchema)