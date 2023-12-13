const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const testSchema = new mongoose.Schema({
  test: {
    type: String,
    required: [true, "Required field!"],
  },
  image: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      originalname: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model(RESOURCE.TEST, testSchema);
