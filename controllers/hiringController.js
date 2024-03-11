const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const hiringServices = require("../services/hiringService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllHiring = asyncHandler(async (req, res, next) => {
  const hiring = await hiringServices.getAllHiringData();

  return hiring?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No hiring found"))
    : SuccessHandler(
        res,
        `hiring with hiring date ${hiring.map((h) => h.date).join(", ")} and IDs ${hiring
          .map((h) => h._id)
          .join(", ")} retrieved`,
        hiring
      );
});

exports.getSingleHiring = asyncHandler(async (req, res, next) => {
  const hiring = await hiringServices.getSingleHiringData(req.params?.id);

  return !hiring
    ? next(new ErrorHandler("No hiring found"))
    : SuccessHandler(
        res,
        `hiring date ${hiring?.date} with ID ${hiring?._id} retrieved`,
        hiring
      );
});

exports.createNewHiring = [
  checkRequiredFields(["date", "time", "type"]),
  asyncHandler(async (req, res, next) => {
    const hiring = await hiringServices.createHiringData(req);

    return SuccessHandler(
      res,
      `Created new Hiring date ${hiring?.date} with an ID ${hiring?._id}`,
      hiring
    );
  }),
];

exports.updateHiring = [
  checkRequiredFields(["date", "time"]),
  asyncHandler(async (req, res, next) => {
    const hiring = await hiringServices.updateHiringData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `Hiring date ${hiring?.date} with ID ${hiring?._id} is updated`,
      hiring
    );
  }),
];

exports.deleteHiring = asyncHandler(async (req, res, next) => {
  const hiring = await hiringServices.deleteHiringData(req.params.id);

  return !hiring
    ? next(new ErrorHandler("No hiring found"))
    : SuccessHandler(
        res,
        `Test ${hiring?.date} with ID ${hiring?._id} is deleted`,
        hiring
      );
});
