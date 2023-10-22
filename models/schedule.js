const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { RESOURCE } = require("../constants/index");

const scheduleSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a user"],
    ref: RESOURCE.USER,
  },
  available: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    required: [true, "Please enter a date"],
  },
  note: {
    type: String,
    required: [true, "Please enter a note"],
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
