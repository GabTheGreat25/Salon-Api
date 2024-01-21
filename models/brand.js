const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const brandSchema = new mongoose.Schema({
    brand_name:{
        type:String,
        required:[true, "brand name field required"]
    }
});

module.exports = mongoose.model(RESOURCE.BRAND, brandSchema);