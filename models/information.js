const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const informationSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Types.ObjectId,
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
      required: [true, "Please enter your allergy"],
    },
  ],
  product_preference: [
    {
      type: String,
      required: [true, "Please enter your product preference"],
    },
  ],
});

module.exports = mongoose.model(RESOURCE.INFORMATION, informationSchema);
