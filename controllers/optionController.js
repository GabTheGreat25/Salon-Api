const optionService = require("../services/optionService");
const ErrorHandler = require("../utils/errorHandler");
const SuccessHandler = require("../utils/successHandler");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");
const { upload } = require("../utils/cloudinary");
const checkRequiredFields = require("../helpers/checkRequiredFields");

exports.getAllOption = asyncHandler(async (req, res, next) => {
  const options = await optionService.getAllOptionData();

  return options?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No Option found"))
    : SuccessHandler(
        res,
        `Option ${options
          .map((option) => option.option_name)
          .join(", ")} and IDs ${options
          .map((option) => option?._id)
          .join(", ")} retrieved`,
        options
      );
});

exports.getSingleOption = asyncHandler(async (req, res, next) => {
  const option = await optionService.getSingleOptionData(req.params?.id);

  return !option
    ? next(new ErrorHandler("No Option Found"))
    : SuccessHandler(
        res,
        `Option ${option.option_name} with ID ${option?._id} retrieved`,
        option
      );
});

exports.createNewOption = [
  upload.array("image"),
  checkRequiredFields([
    "service",
    "option_name",
    "description",
    "extraFee",
    "image",
  ]),
  asyncHandler(async (req, res) => {
    const option = await optionService.createOptionData(req);

    return SuccessHandler(
      res,
      `New option of ${option.option_name} is created with ID ${option?._id}`,
      option
    );
  }),
];

exports.updateOption = [
  upload.array("image"),
  checkRequiredFields([
    "service",
    "option_name",
    "description",
    "extraFee",
    "image",
  ]),
  asyncHandler(async (req, res, next) => {
    const option = await optionService.updateOptionData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Option ${option?.option_name} with ID ${option?._id} is updated`,
      option
    );
  }),
];

exports.deleteOption = asyncHandler(async (req, res, next) => {
  const option = await optionService.deleteOptionData(req.params.id);

  return !option
    ? next(new ErrorHandler("No option found"))
    : SuccessHandler(
        res,
        `Option ${option?.option_name} with ID ${option?._id} is deleted`,
        option
      );
});
