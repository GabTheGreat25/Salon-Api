const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const addOnsSchema = new mongoose.Schema({
  product: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a product"],
      ref: "product",
    },
  ],
  addOns_name: {
    type: String,
    required: [true, "AddOns name required"],
    maxLength: [60, "AddOns Name Field must not exceed to 60 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter a description of your addOns"],
  },
  price: {
    type: Number,
    required: [true, "Please enter a price"],
    min: 0,
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

module.exports = mongoose.model(RESOURCE.ADDONS, addOnsSchema);
