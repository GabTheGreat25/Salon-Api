const reportService = require("../services/reportService");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");

exports.getAllReports = asyncHandler(async (req, res, next) => {
  const reports = await reportService.getAllReportsData();

  return !reports
    ? next(new ErrorHandler("Reports not Found"))
    : SuccessHandler(
        res,
        `Reports Found with ID ${reports
          .map((r) => r?._id)
          .join(",")} retrieved`,
        reports
      );
});

exports.getOneReport = asyncHandler(async (req, res, next) => {
  const report = await reportService.getOneReportData(req.params?.id);

  return !report
    ? next(new ErrorHandler("Report not Found"))
    : SuccessHandler(res, `Report with ID ${report?._id} retrieved`, report);
});

exports.createReport = [
  asyncHandler(async (req, res, next) => {
    const report = await reportService.createReportData(req);

    return SuccessHandler(res, `Report successfully created`, report);
  }),
];

exports.updateReport = [
  asyncHandler(async (req, res, next) => {
    const report = await reportService.updateReportData(
      req,
      res,
      req.params?.id
    );

    return SuccessHandler(res, `Report successfully updated`, report);
  }),
];

exports.deleteReport = asyncHandler(async (req, res, next) => {
  const report = await reportService.deleteReportData(req.params?.id);

  return !report
    ? next(new ErrorHandler("Report Not Found"))
    : SuccessHandler(res, `Report successfully deleted`, report);
});
