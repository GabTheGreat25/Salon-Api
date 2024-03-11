const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const hiringSchema = new mongoose.Schema({
  date: {
    type: Date,
  },
  time: {
    type: String,
  },
  type: {
    type: String,
  },
  isHiring: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = new mongoose.model(RESOURCE.HIRING, hiringSchema);
