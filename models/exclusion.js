const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const exclusionSchema = new mongoose.Schema({
  ingredient_name: {
    type: String,
    required: [true, "Ingredient Name field required"],
    maxLength: [255, "Ingredients name must not exceed to 255 characters"],
  },
  type: [
    {
      type: String,
      enum: ["Hands", "Hair", "Feet", "Face", "Body", "Eyelash"],
    },
  ],
});

module.exports = mongoose.model(RESOURCE.EXCLUSION, exclusionSchema);
