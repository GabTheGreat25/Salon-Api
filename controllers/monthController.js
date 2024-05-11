const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const monthsService = require("../services/monthService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllMonths = asyncHandler(async (req, res, next) => {
  const months = await monthsService.getAllMonthData();

  return months?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No months found"))
    : SuccessHandler(
        res,
        `Months of with IDs ${months
          .map((month) => month?._id)
          .join(", ")} retrieved`,
        months
      );
});

exports.getSingleMonth = asyncHandler(async (req, res, next) => {
  const month = await monthsService.getSingleMonthData(req.params?.id);

  return !month
    ? next(new ErrorHandler("No month found"))
    : SuccessHandler(res, `Month with ID ${month?._id} retrieved`, month);
});

exports.createNewMonth = [
  checkRequiredFields(["message"]),
  asyncHandler(async (req, res, next) => {
    const month = await monthsService.createMonthData(req);

    return SuccessHandler(res, `Created new Month`, month);
  }),
];

exports.updateMonth = [
  checkRequiredFields(["message"]),
  asyncHandler(async (req, res, next) => {
    const month = await monthsService.updateMonthData(req, res, req.params.id);

    return SuccessHandler(res, `Month is updated`, month);
  }),
];

exports.deleteMonth = asyncHandler(async (req, res, next) => {
  const month = await monthsService.deleteMonthData(req.params.id);

  return !month
    ? next(new ErrorHandler("No month found"))
    : SuccessHandler(res, `Month ${month?.name} is deleted`, month);
});
