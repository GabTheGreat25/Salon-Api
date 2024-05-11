const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const exclusionServices = require("../services/exclusionService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllExclusions = asyncHandler(async (req, res, next) => {
  const exclusions = await exclusionServices.getAllExclusionData();

  return exclusions?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No exclusions found"))
    : SuccessHandler(
        res,
        `Exclusions with ingredients ${exclusions
          .map((e) => e.ingredient_name)
          .join(", ")} and IDs ${exclusions
          .map((e) => e._id)
          .join(", ")} retrieved`,
        exclusions
      );
});

exports.getSingleExclusion = asyncHandler(async (req, res, next) => {
  const exclusion = await exclusionServices.getSingleExclusionData(
    req.params?.id
  );

  return !exclusion
    ? next(new ErrorHandler("No Ingredients found"))
    : SuccessHandler(
        res,
        `Test ${exclusion?.ingredient_name} with ID ${exclusion?._id} retrieved`,
        exclusion
      );
});

exports.createNewExclusion = [
  checkRequiredFields(["ingredient_name", "type"]),
  asyncHandler(async (req, res, next) => {
    const exclusion = await exclusionServices.createExclusionData(req);

    return SuccessHandler(
      res,
      `Created new Exclusion ${exclusion?.ingredient_name}`,
      exclusion
    );
  }),
];

exports.updateExclusion = [
  checkRequiredFields(["ingredient_name", "type"]),
  asyncHandler(async (req, res, next) => {
    const exclusion = await exclusionServices.updateExclusionData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Ingredient ${exclusion?.ingredient_name}s is updated`,
      exclusion
    );
  }),
];

exports.deleteExclusion = asyncHandler(async (req, res, next) => {
  const exclusion = await exclusionServices.deleteExclusionData(req.params.id);

  return !exclusion
    ? next(new ErrorHandler("No ingredient found"))
    : SuccessHandler(
        res,
        `Ingredients ${exclusion?.ingredient_name} is deleted`,
        exclusion
      );
});
