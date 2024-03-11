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
        `Schedules of ${schedules
          .map((schedule) => schedule?.beautician?.name)
          .join(", ")} and IDs ${schedules
          .map((schedule) => schedule?._id)
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
        `Schedule of ${schedule?.beautician?.name} with ID ${schedule?._id} retrieved`,
        schedule
      );
});

exports.confirmLeave = asyncHandler(async (req, res, next) => {
  const scheduleId = req.params.id;

  await schedulesService.confirmLeaveNote(scheduleId);

  SuccessHandler(res, `Leave has been approved by the admin.`, scheduleId);
});

exports.createNewSchedule = [
  checkRequiredFields(["beautician", "date"]),
  asyncHandler(async (req, res, next) => {
    const { schedule } = await schedulesService.createScheduleData(req);

    return SuccessHandler(
      res,
      `New schedule of ${schedule?.beautician?.name} created with an ID ${schedule?._id}`,
      schedule
    );
  }),
];

exports.updateSchedule = [
  asyncHandler(async (req, res, next) => {
    const { updatedSchedule } = await schedulesService.updateScheduleData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Schedule of ${updatedSchedule?.beautician?.name} with ID ${updatedSchedule?._id} is updated`,
      { updatedSchedule }
    );
  }),
];

exports.updateScheduleAdmin = [
  asyncHandler(async (req, res, next) => {
    const { updatedSchedule } = await schedulesService.updateScheduleAdminData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Schedule of ${updatedSchedule?.beautician?.name} with ID ${updatedSchedule?._id} is updated`,
      { updatedSchedule }
    );
  }),
];

exports.deleteConfirm = asyncHandler(async (req, res, next) => {
  const schedule = await schedulesService.getSingleScheduleData(req.params.id);

  const beauticianName = schedule?.beautician?.name || "Unknown";

  await schedulesService.deleteConfirmData(req.params.id);

  return !schedule
    ? next(new ErrorHandler("No schedule found"))
    : SuccessHandler(
        res,
        `Schedule of ${beauticianName} with ID ${schedule?._id} is deleted`,
        schedule
      );
});

exports.deleteSchedule = asyncHandler(async (req, res, next) => {
  const schedule = await schedulesService.getSingleScheduleData(req.params.id);

  const beauticianName = schedule?.beautician?.name || "Unknown";

  await schedulesService.deleteScheduleData(req.params.id);

  return !schedule
    ? next(new ErrorHandler("No schedule found"))
    : SuccessHandler(
        res,
        `Schedule of ${beauticianName} with ID ${schedule?._id} is deleted`,
        schedule
      );
});
