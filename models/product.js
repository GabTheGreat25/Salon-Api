const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, "Product Name Field Required"],
    maxLength: [60, "Product Name Field must not exceed 60 characters"],
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Brand field required"],
    ref: "brand",
  },
  type: [
    {
      type: String,
      enum: ["Hands", "Hair", "Feet", "Facial", "Body", "Eyelash"],
    },
  ],
  // measurement: {
  //   quantity: {
  //     type: Number,
  //     required: [true, "Quantity Field Required"],
  //     min: [0, "Quantity must be a positive number"],
  //   },
  //   unit: {
  //     type: String,
  //     required: [true, "Unit Field Required"],
  //     enum: [
  //       "Liter",
  //       "Milliliter",
  //       "Gallon",
  //       "Ounce",
  //       "Pound",
  //       "Kilogram",
  //       "Other",
  //     ],
  //   },
  // },
  isNew: {
    type: Boolean,
    default: false,
  },
  ingredients: {
    type: String,
    required: [true, "Ingredients Field Required"],
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
  quantity:{
    type: Number,
    required: false,
    default: 0,
  },
  product_volume:{
    type: Number,
    required: [true, "Product volume required"],
    min: 5,
  }
});

module.exports = mongoose.model(RESOURCE.PRODUCT, productSchema);
