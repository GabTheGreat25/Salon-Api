const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const exclusionSchema = new mongoose.Schema({
  ingredient_name: {
    type: String,
    required: [true, "Ingredient Name field required"],
  },
  type: [
    {
      type: String,
      enum: ["Hands", "Hair", "Feet", "Facial", "Body", "Eyelash"],
    },
  ],
});

module.exports = mongoose.model(RESOURCE.EXCLUSION, exclusionSchema);
