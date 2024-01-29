const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const scheduleSchema = new mongoose.Schema({
  beautician: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a beautician"],
    ref: RESOURCE.USER,
  },
  isAvailable: [
    {
      type: String,
      required: [true, "Please add availability"],
    },
  ],
  date: {
    type: Date,
    required: [true, "Please enter a date"],
  },
  attendance: {
    type: String,
    enum: ["present", "absent", "leave"],
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
  leaveNoteConfirmed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.SCHEDULE, scheduleSchema);
