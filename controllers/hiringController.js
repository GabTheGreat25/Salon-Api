const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const hiringServices = require("../services/hiringService");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");

exports.getAllHiring = asyncHandler(async (req, res, next) => {
  const hiring = await hiringServices.getAllHiringData();

  return hiring?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No hiring found"))
    : SuccessHandler(
        res,
        `hiring IDs ${hiring.map((h) => h._id).join(", ")} retrieved`,
        hiring
      );
});

exports.getSingleHiring = asyncHandler(async (req, res, next) => {
  const hiring = await hiringServices.getSingleHiringData(req.params?.id);

  return !hiring
    ? next(new ErrorHandler("No hiring found"))
    : SuccessHandler(res, `hiring ID ${hiring?._id} retrieved`, hiring);
});

exports.createNewHiring = [
  asyncHandler(async (req, res, next) => {
    const hiring = await hiringServices.createHiringData(req);

    return SuccessHandler(res, `Created new Hiring`, hiring);
  }),
];

exports.updateHiring = [
  asyncHandler(async (req, res, next) => {
    const hiring = await hiringServices.updateHiringData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(res, `Hiring date is updated`, hiring);
  }),
];

exports.deleteHiring = asyncHandler(async (req, res, next) => {
  const hiring = await hiringServices.deleteHiringData(req.params.id);

  return !hiring
    ? next(new ErrorHandler("No hiring found"))
    : SuccessHandler(res, `Hiring is deleted`, hiring);
});
