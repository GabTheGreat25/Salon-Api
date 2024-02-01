const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const serviceSchema = new mongoose.Schema({
  product: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a product"],
      ref: "product",
    },
  ],
  service_name: {
    type: String,
    required: [true, "Service name required"],
    maxLength: [60, "Service Name Field must not exceed to 60 characters"],
  },
  description: {
    type: String,
    required: [true, "Please enter a description of your service"],
  },
  price: {
    type: Number,
    required: [true, "Please enter a price"],
    min: 0,
  },
  type: {
    type: String,
    enum: ["Hands", "Hair", "Feet", "Nails", "Face", "Body"],
  },
  occassion: {
    type: String,
    enum: [
      "Graduation",
      "Js Prom",
      "Halloween",
      "Christmas",
      "Valentines",
      "Wedding",
    ],
  },

  duration: {
    type: String,
    required: [true, "Please enter service duration"],
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

module.exports = mongoose.model(RESOURCE.SERVICE, serviceSchema);
