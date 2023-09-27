const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const testSchema = new mongoose.Schema({
  test: {
    type: String,
    required: [true, "Required field!"],
  },
});

module.exports = mongoose.model(RESOURCE.TEST, testSchema);
