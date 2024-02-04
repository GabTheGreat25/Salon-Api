const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const monthSchema = new mongoose.Schema({
  month: {
    type: Number,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model(RESOURCE.MONTH, monthSchema);
