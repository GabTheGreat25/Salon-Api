const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");
const timeServices = require("../services/timeService");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllTimes = asyncHandler(async (req, res, next) => {
  const times = await timeServices.getAllTimesData();

  return !times?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No times found"))
    : SuccessHandler(
        res,
        `Salon Available Time ${times
          .map((time) => time?.time)
          .join(", ")} and ID's ${times
          .map((time) => time?._id)
          .join(", ")} retrieved`,
        times
      );
});

exports.getOneTime = asyncHandler(async (req, res, next) => {
  const time = await timeServices.getOneTimeData(req.params?.id);

  return !time
    ? next(new ErrorHandler("Time not found"))
    : SuccessHandler(
        res,
        `Salon Appointment Time with ${time?._id} retrieved`,
        time
      );
});

exports.createTime = [
  checkRequiredFields(["time"]),
  asyncHandler(async (req, res, next) => {
    const time = await timeServices.createTimeData(req);

    return SuccessHandler(
      res,
      `Created new Appointment Time ${time?.time}`,
      time
    );
  }),
];

exports.updateTime = [
  checkRequiredFields(["time"]),
  asyncHandler(async (req, res, next) => {
    const time = await timeServices.updateTimeData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `Appointment Time ${time?.time} is updated`,
      time
    );
  }),
];

exports.deleteTime = asyncHandler(async (req, res, next) => {
  const time = await timeServices.deleteTimeData(req.params.id);

  return !time
    ? next(new ErrorHandler("No time found"))
    : SuccessHandler(res, `Appointment Time ${time?.time} is deleted`, time);
});
