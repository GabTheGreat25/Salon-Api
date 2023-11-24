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
});

module.exports = mongoose.model(RESOURCE.PRODUCT, productSchema);
