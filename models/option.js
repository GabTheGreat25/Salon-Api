const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

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
    maxLength: [60, "Option Name Field must not exceed to 60 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter a description of your option"],
  },
  price: {
    type: Number,
    required: [true, "Please enter a price"],
    min: 0,
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
});

module.exports = mongoose.model(RESOURCE.OPTION, optionSchema);
