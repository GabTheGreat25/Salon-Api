const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { RESOURCE } = require("../constants/index");

const scheduleSchema = new mongoose.Schema({
  beautician: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a beautician"],
    ref: RESOURCE.USER,
  },
  available: {
    type: Boolean,
    default: false,
  },
  isLeave: {
    type: Boolean,
    default: false,
  },
  leaveNote: {
    type: String,
    required: function () {
      return this.isLeave;
    },
    maxLength: [60, "Leave note must not exceed 60 characters"],
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
        return /^[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(value);
      },
      message: "Invalid time format. Please use 'HH:MM:SS'.",
    },
  },
});

scheduleSchema.plugin(AutoIncrement, {
  inc_field: "scheduleInc",
  id: "scheduleNum",
});

module.exports = mongoose.model(RESOURCE.SCHEDULE, scheduleSchema);
