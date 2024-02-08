const ingredientService = require("../services/ingredientService");
const ErrorHandler = require("../utils/errorHandler");
const SuccessHandler = require("../utils/successHandler");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");
const checkRequiredFields = require("../helpers/checkRequiredFields");

exports.getAllIngredients = asyncHandler(async (req, res, next) => {
  const ingredients = await ingredientService.getAllIngredientData();

  return ingredients?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No Ingredients found"))
    : SuccessHandler(
        res,
        `Ingredients ${ingredients
          .map((ingredient) => ingredient?.ingredient_name)
          .join(", ")} and IDs ${ingredients
          .map((ingredient) => ingredient?._id)
          .join(", ")} retrieved`,
        ingredients
      );
});

exports.getSingleIngredient = asyncHandler(async (req, res, next) => {
  const ingredient = await ingredientService.getSingleIngredientData(
    req.params?.id
  );

  return !ingredient
    ? next(new ErrorHandler("No Ingredient Found"))
    : SuccessHandler(
        res,
        `Ingredient ${ingredient?.ingredient_name} with ID ${ingredient?._id} retrieved`,
        ingredient
      );
});

exports.createNewIngredient = [
  checkRequiredFields(["product", "ingredient_name"]),
  asyncHandler(async (req, res) => {
    const ingredient = await ingredientService.createIngredientData(req);

    return SuccessHandler(
      res,
      `New ingredient of ${ingredient?.ingredient_name} is created with ID ${ingredient?._id}`,
      ingredient
    );
  }),
];

exports.updateIngredient = [
  checkRequiredFields(["product", "ingredient_name"]),
  asyncHandler(async (req, res, next) => {
    const ingredient = await ingredientService.updateIngredientData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Ingredient ${ingredient?.ingredient_name} with ID ${ingredient?._id} is updated`,
      ingredient
    );
  }),
];

exports.deleteIngredient = asyncHandler(async (req, res, next) => {
  const ingredient = await ingredientService.deleteIngredientData(
    req.params.id
  );

  return !ingredient
    ? next(new ErrorHandler("No ingredient found"))
    : SuccessHandler(
        res,
        `Ingredient ${ingredient?.ingredient_name} with ID ${ingredient?._id} is deleted`,
        ingredient
      );
});
