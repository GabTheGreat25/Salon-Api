const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const equipmentSchema = new mongoose.Schema({
  equipment_name: {
    type: String,
    required: [true, "Equipment name required"],
    maxLength: [255, "Equipment name must not exceed 255 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter the description of the equipment"],
  },
  equipment_price: {
    type: Number,
    required: [true, "Please enter equipment price"],
    min: 0,
  },
  purchased_date: {
    type: Date,
    required: [true, "Please enter purchased date"],
  },
  status: {
    type: String,
    enum: ["Missing", "Lost", "Found"],
    default: "Found",
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
    min: [
      0,
      "Quantity field must be 0 or more to make the equipment unavailable when quantity is zero",
    ],
    max: [
      1,
      "Quantity field must be 1 or less to represent the availability of the equipment",
    ],
    default: 0,
  },
  isAvailable:{
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model(RESOURCE.EQUIPMENT, equipmentSchema);
