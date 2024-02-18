const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const transactionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter an appointment"],
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
      values: ["Cash"],
    },
  },
  qrCode: {
    type: String,
    required: false,
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
  hasDiscount: {
    type: Boolean,
    default: false,
  },
  customer_type: {
    type: String,
    default: "customer",
    enum: {
      values: ["customer", "pwd", "senior"],
    },
  },
});

module.exports = mongoose.model(RESOURCE.TRANSACTION, transactionSchema);
