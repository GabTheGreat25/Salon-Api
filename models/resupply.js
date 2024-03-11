const mongoose = require("mongoose");
const { RESOURCE } = require(".././constants/index");

const resupplySchema = new mongoose.Schema({
  supplier_name: {
    type: String,
    required: [true, "Please enter supplier's name"],
    maxLength: [60, "Supplier name must not exceed to 60 characters"],
  },
  equipment: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a equipment"],
      ref: "equipment",
    },
  ],
  equipment_price:{
    type: Number,
    required: [true, "Please enter a price"],
    min: 0,
  },
  date: {
    type: Date,
    required: [true, "Please enter a date"],
    default: Date.now,
},
  status: {
    type: String,
    default: "pending",
    enum: {
      values: ["pending", "completed", "cancelled"],
    },
  },
  quantity: {
    type: Number,
    required: [true, "Quantity field required"],
    min: [1, "Quantity field must be at least 1"],
    default: 1,
  },
});

module.exports = mongoose.model(RESOURCE.RESUPPLY, resupplySchema);

