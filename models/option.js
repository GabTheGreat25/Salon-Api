const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE } = require("../constants/index");

const optionSchema = new mongoose.Schema({
  service: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a service"],
      ref: "service",
    },
  ],
  option_name: {
    type: String,
    required: [true, "Option name required"],
  },
  description: {
    type: String,
    required: [true, "Please enter a description of your option"],
  },
  extraFee: {
    type: Number,
    required: [true, "Please enter a extraFee"],
    default: STATUSCODE.ZERO,
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
  type: {
    type: String,
    enum: ["Hands", "Hair", "Feet", "Facial", "Body", "Eyelash"],
  },
});

module.exports = mongoose.model(RESOURCE.OPTION, optionSchema);
