const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const hiringSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, "Date field required"],
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
  type: {
    type: String,
    enum: ["Beautician", "Receptionist"],
  },
  isHiring: {
    type: Boolean,
    default: false,
  },
});

module.exports = new mongoose.model(RESOURCE.HIRING, hiringSchema);
