const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE } = require("../constants/index");

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
  },
  description: {
    type: String,
    required: [true, "Please enter a description of your service"],
  },
  price: {
    type: Number,
    required: [true, "Please enter a price"],
    min: STATUSCODE.ONE,
  },
  type: [
    {
      type: String,
      enum: ["Hands", "Hair", "Feet", "Facial", "Body", "Eyelash"],
    },
  ],

  occassion: {
    type: String,
    enum: [
      "Graduation",
      "Js Prom",
      "Halloween",
      "Christmas",
      "Valentines",
      "Wedding",
      "New Year",
      "Birthday",
      "None",
    ],
    default: "None",
  },
  duration: {
    type: String,
    required: [true, "Please enter service duration"],
  },
  warranty: {
    type: String,
    required: [true, "Please enter warranty"],
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
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(RESOURCE.SERVICE, serviceSchema);
