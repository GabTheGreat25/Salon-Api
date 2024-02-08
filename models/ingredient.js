const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const ingredientSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Please enter a product"],
    ref: "product",
  },
  ingredient_name: [
    {
      type: String,
      required: [true, "Ingredient name required"],
    },
  ],
});

module.exports = mongoose.model(RESOURCE.INGREDIENT, ingredientSchema);
