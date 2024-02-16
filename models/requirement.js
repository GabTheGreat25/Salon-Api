const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const requirementSchema = new mongoose.Schema({
  beautician: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter an beautician"],
    ref: RESOURCE.USER,
  },
  job_type: {
    type: String,
    required: [true, "Please pick a job_type"],
    enum: ["Hands", "Hair", "Feet", "Nails", "Face", "Body", "Nails"],
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
});

module.exports = mongoose.model(RESOURCE.REQUIREMENT, requirementSchema);
