const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const appointmentSchema = new mongoose.Schema({
  service: [
    {
      type: mongoose.Types.ObjectId,
      required: [true, "Please enter a service"],
      ref: RESOURCE.SERVICE,
    },
  ],
  beautician: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please enter a beautician"],
    ref: RESOURCE.USER,
  },
  customer: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please enter a customer"],
    ref: RESOURCE.USER,
  },
  date: {
    type: Date,
    required: [true, "Please enter a date"],
  },
  time: {
    type: String,
    required: [true, "Please enter a time"],
    validate: {
      validator: (value) => {
        return /^(0?[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/i.test(value);
      },
      message: "Invalid time format. Please use 'HH:MM AM/PM'.",
    },
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
});

module.exports = mongoose.model(RESOURCE.APPOINTMENT, appointmentSchema);
