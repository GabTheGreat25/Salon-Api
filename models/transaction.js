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
    enum: {
      values: ["Cash", "Maya"],
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
    default: "Customer",
    enum: {
      values: ["Customer", "Pwd", "Senior"],
    },
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.TRANSACTION, transactionSchema);
