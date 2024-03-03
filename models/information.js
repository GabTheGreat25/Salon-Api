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
  othersMessage: {
    type: String,
    required: [
      function () {
        return this.allergy.includes("Others");
      },
      "Please specify the type of chemical you are allergic to",
    ],
  },                                                                                                            
  eSignature: {
    type: String,
    required: function () {
      return this.allergy.includes("Others") || this.allergy.includes("None")
        ? false
        : true;
    },
    message: "Please enter your e-signature",
  },
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
