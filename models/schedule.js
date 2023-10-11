const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
const { RESOURCE } = require("../constants/index");

const scheduleSchema = new mongoose.Schema({
  user: {
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
});

scheduleSchema.plugin(AutoIncrement, {
  inc_field: "scheduleInc",
  id: "scheduleNum",
});

module.exports = mongoose.model(RESOURCE.SCHEDULE, scheduleSchema);
