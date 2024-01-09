const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const statusSchema = new mongoose.Schema({
  schedule: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a schedule"],
    ref: RESOURCE.SCHEDULE,
  },
  attendance: {
    type: String,
    enum: ["present", "absent", "leave"],
  },
});

module.exports = mongoose.model(RESOURCE.STATUS, statusSchema);
