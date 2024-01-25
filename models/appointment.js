const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const appointmentSchema = new mongoose.Schema({
  service: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a service"],
      ref: RESOURCE.SERVICE,
    },
  ],
  beautician: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a beautician"],
    ref: RESOURCE.USER,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a customer"],
    ref: RESOURCE.USER,
  },
  date: {
    type: Date,
    required: [true, "Please enter a date"],
  },
  time:{  
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a time"],
      ref: RESOURCE.TIME,
  },
  price: {
    type: Number,
    required: [true, "Please enter a total price"],
    min: 0,
  },
  extraFee: {
    type: Number,
    required: false,
    min: 0,
  },
  note: {
    type: String,
    required: false,
  },
  rebookReason: {
    type: String,
    enum: {
      values: [
        "Schedule Conflict",
        "Change Of Plans",
        "Emergency",
        "Travel Conflict",
        "Personal Reasons",
        "Others",
      ],
    },
    required: false,
  },
});

module.exports = mongoose.model(RESOURCE.APPOINTMENT, appointmentSchema);
