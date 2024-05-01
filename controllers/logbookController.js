const logbookService = require("../services/logbookService");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");

exports.getAllLogs = asyncHandler(async (req, res, next) => {
  const logs = await logbookService.getAllLogsData();

  return !logs
    ? next(new ErrorHandler("Logbooks not found"))
    : SuccessHandler(
        res,
        `Logbooks Data found with users ${logs
          ?.map((l) => l?.user?.name)
          .join(",")} with LogBook ID ${logs
          ?.map((l) => l?._id)
          .join(",")} retrieved`,
        logs
      );
});

exports.getOneLog = asyncHandler(async (req, res, next) => {
  const log = await logbookService.getOneLogData(req.params.id);

  return !log
    ? next(new ErrorHandler("Log Book data not found"))
    : SuccessHandler(
        res,
        `Logbook data with user ${log?.user?.name} with LogBook ID ${log?._id} retrieved`,
        log
      );
});

exports.createLogBook = [
  asyncHandler(async (req, res, next) => {
    const log = await logbookService.createLogsData(req);

    return SuccessHandler(
      res,
      `Logbook with ${log?.user?.name} with ID ${log?._id} Successfully created `,
      log
    );
  }),
];

exports.updateLogBook = [
  asyncHandler(async (req, res, next) => {
    const log = await logbookService.updateLogsData(req, res, req.params?.id);

    return SuccessHandler(
      res,
      `${log?.user?.name} Logbook with ID ${log?._id} successfully created`,
      log
    );
  }),
];

exports.deleteLogBook = asyncHandler(async (req, res, next) => {
  const log = await logbookService.deleteLogBookData(req.params?.id);

  return !log
    ? next(new ErrorHandler(`Logbook not found`))
    : SuccessHandler(
        res,
        `${log?.user?.name} Logbook with ID ${log?._id} successfully deleted`,
        log
      );
});
