const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const transactionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please enter a appointment"],
    ref: RESOURCE.APPOINTMENT,
  },
  status: {
    type: String,
    default: "pending",
    enum: {
      values: ["pending", "completed", "cancelled"],
    },
  },
  payment: {
    type: String,
    default: "Cash",
    enum: {
      values: ["Cash", "Gcash"],
    },
  },
});

module.exports = mongoose.model(RESOURCE.TRANSACTION, transactionSchema);
