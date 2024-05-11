const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE } = require("../constants/index");

const equipmentSchema = new mongoose.Schema({
  equipment_name: {
    type: String,
    required: [true, "Equipment name required"],
  },
  equipment_status: {
    type: String,
    enum: ["Found", "Missing", "Lost"],
    default: "Found",
  },
  equipment_price: {
    type: Number,
    required: [true, "Equipment price required"],
    default: STATUSCODE.ZERO,
  },
  quantity: {
    type: Number,
    required: [true, "Equipment quantity required"],
  },
  missing_qty: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  damage_qty: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  borrow_qty: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  found_qty: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  status: {
    type: String,
    enum: ["Available", "Not Available"],
    default: "Available",
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

module.exports = mongoose.model(RESOURCE.EQUIPMENT, equipmentSchema);
