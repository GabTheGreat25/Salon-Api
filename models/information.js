const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const informationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a customer"],
    ref: RESOURCE.USER,
  },
  description: {
    type: String,
    required: [true, "Please enter your description"],
  },
  allergy: [
    {
      type: String,
      default: "None",
    },
  ],
  product_preference: [
    {
      type: String,
      default: "None",
    },
  ],
  messageDate: {
    type: String,
    enum: [
      "1 minute",
      "1 month",
      "2 months",
      "4 months",
      "6 months",
      "1 year",
      "stop",
    ],
    default: "1 minute",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(RESOURCE.INFORMATION, informationSchema);
