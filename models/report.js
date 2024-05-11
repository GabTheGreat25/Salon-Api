const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE } = require("../constants/index");

const reportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "User required"],
    ref: RESOURCE.USER,
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Equipment required"],
    ref: RESOURCE.EQUIPMENT,
  },
  date_missing: {
    type: Date,
    required: false,
  },
  date_found: {
    type: Date,
    required: false,
  },
  quantity_missing: {
    type: Number,
    required: [true, "Please input missing quantity"],
  },
  damage_quantity: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  quantity_found: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  status: {
    type: String,
    enum: [
      "Missing",
      "Damage",
      "Partially Found",
      "Found",
      "Missing & Damage",
      "Found Damage",
    ],
  },
  input_qty: {
    type: Number,
    required: false,
    default: STATUSCODE.ZERO,
  },
  initial_found: {
    type: Number,
    required: false,
  },
});

module.exports = mongoose.model(RESOURCE.REPORT, reportSchema);
