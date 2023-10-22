const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, "Product Name Field Required"],
    maxLength: [60, "Product Name Field must not exceed to 60 characters"],
  },
  brand: {
    type: String,
    required: [true, "Product Brand Field Required"],
    maxLength: [60, "Brand Field must not exceed to 60 characters"],
  },
  type: {
    type: String,
    required: [true, "Product Type Field Required"],
    maxLength: [60, "Type Field character must not exceed to 60 characters"],
  },
  quantity: {
    type: Number,
    required: [true, "Product Quantity Field Required"],
    maxLength: [8, "Quantity must not exceed to 8 characters"],
  },
  image: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      originalname: {
        type: String,
        required: true,
      },
    },
  ],
  created_date:{
    type:Date,
    required:[true, "Created date Field Required"],
    
  },
  expired_at:{
    type:Date,
    required:[true, "Please enter expiration date"]
  }
});

module.exports = mongoose.model(RESOURCE.PRODUCT, productSchema);
