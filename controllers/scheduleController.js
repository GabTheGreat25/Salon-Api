const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const schedulesService = require("../services/scheduleService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllSchedules = asyncHandler(async (req, res, next) => {
  const schedules = await schedulesService.getAllSchedulesData();

  return schedules?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No schedules found"))
    : SuccessHandler(
        res,
        `Schedules with schedule of ${schedules
          .map((u) => u?.employee?.name)
          .join(", ")} and IDs ${schedules
          .map((u) => u?._id)
          .join(", ")} retrieved`,
        schedules
      );
});

exports.getSingleSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await schedulesService.getSingleScheduleData(req.params.id);

  return !schedule
    ? next(new ErrorHandler("No schedule found"))
    : SuccessHandler(
        res,
        `Schedule of ${schedule?.employee?.name} with ID ${schedule?._id} retrieved`,
        schedule
      );
});

exports.createNewSchedule = [
  checkRequiredFields(["employee", "date", "time","note"]),
  asyncHandler(async (req, res, next) => {
    const schedule = await schedulesService.createScheduleData(req);

    return SuccessHandler(
      res,
      `New schedule of ${schedule?.employee?.name} created with an ID ${schedule?._id}`,
      schedule
    );
  }),
];

exports.updateSchedule = [
  checkRequiredFields(["employee", "date", "time","note"]),
  asyncHandler(async (req, res, next) => {
    const schedule = await schedulesService.updateScheduleData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Schedule of ${schedule?.employee?.name} with ID ${schedule?._id} is updated`,
      schedule
    );
  }),
];

exports.deleteSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await schedulesService.deleteScheduleData(req.params.id);

  return !schedule
    ? next(new ErrorHandler("No schedule found"))
    : SuccessHandler(
        res,
        `Schedule of ${schedule?.employee?.name} with ID ${schedule?._id} is deleted`,
        schedule
      );
});
