const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE, ROLE } = require("../constants/index");
const User = require("./user");
const { sendSMS } = require("../utils/twilio");

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: [true, "Product Name Field Required"],
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
  quantity: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  product_volume: {
    type: Number,
    min: STATUSCODE.FIVE,
  },
  product_consume: {
    type: Number,
    required: [true, "Consumed product per service required"],
    default: STATUSCODE.ZERO,
  },
  remaining_volume: {
    type: Number,
    default: STATUSCODE.ZERO,
  },
  product_measurement: {
    type: String,
    enum: ["ml", "liter", "pcs"],
    default: "ml",
  },
  volume_description: {
    type: String,
    enum: ["Milliliter", "Pieces"],
    default: "Milliliter",
  },
});

module.exports = mongoose.model(RESOURCE.PRODUCT, productSchema);
