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
});

module.exports = mongoose.model(RESOURCE.INFORMATION, informationSchema);
