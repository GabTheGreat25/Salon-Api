const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE } = require("../constants/index");

const appointmentSchema = new mongoose.Schema({
  service: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a service"],
      ref: RESOURCE.SERVICE,
    },
  ],
  option: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a option"],
      ref: RESOURCE.OPTION,
    },
  ],
  beautician: [
    {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Please enter a beautician"],
      ref: RESOURCE.USER,
    },
  ],
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a customer"],
    ref: RESOURCE.USER,
  },
  date: {
    type: Date,
    required: [true, "Please enter a date"],
  },
  time: [
    {
      type: String,
      required: [true, "Please enter a time"],
    },
  ],
  price: {
    type: Number,
    required: [true, "Please enter a total price"],
    min: STATUSCODE.ONE,
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
  messageReason: {
    type: String,
    required: false,
  },
  isRebooked: {
    type: Boolean,
    default: true,
  },
  isRescheduled: {
    type: Boolean,
    default: false,
  },
  hasAppointmentFee: {
    type: Boolean,
    default: false,
  },
  originalData: {
    beautician: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    date: {
      type: Date,
    },
    time: [
      {
        type: String,
      },
    ],
  },
});

module.exports = mongoose.model(RESOURCE.APPOINTMENT, appointmentSchema);
