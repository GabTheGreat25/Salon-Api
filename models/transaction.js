const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const transactionSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Types.ObjectId,
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
      values: ["Cash", "Gcash"],
    },
  },
  image: [
    {
      public_id: {
        type: String,
        required: function () {
          return this.payment === "Gcash";
        },
      },
      url: {
        type: String,
        required: function () {
          return this.payment === "Gcash";
        },
      },
      originalname: {
        type: String,
        required: function () {
          return this.payment === "Gcash";
        },
      },
    },
  ],
  qrCode: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model(RESOURCE.TRANSACTION, transactionSchema);
