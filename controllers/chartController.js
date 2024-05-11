const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const AsyncHandler = require("express-async-handler");
const chartService = require("../services/chartService");

exports.getAllServiceTypes = AsyncHandler(async (req, res, next) => {
  const types = await chartService.getAllServiceTypesData();

  return !types
    ? next(new ErrorHandler("Service Types not Found"))
    : SuccessHandler(res, "Service Appointments Found", types);
});

exports.getAppointmentCustomer = AsyncHandler(async (req, res, next) => {
  const customer = await chartService.getAppointmentCustomerData();

  return !customer
    ? next(new ErrorHandler("Customer Data not Found"))
    : SuccessHandler(res, "Customer Gender Data Found", customer);
});

exports.getLogBookReport = AsyncHandler(async (req, res, next) => {
  const logbook = await chartService.logBookData();

  return !logbook
    ? next(new ErrorHandler("LogBook Reports not Found"))
    : SuccessHandler(res, "LogBook Report Found", logbook);
});

exports.equipmentReport = AsyncHandler(async (req, res, next) => {
  const equipment = await chartService.equipmentReportData();

  return !equipment
    ? next(new ErrorHandler("Equipment Report Not Found"))
    : SuccessHandler(res, "Equipment Report Found", equipment);
});

exports.getAppointmentReport = AsyncHandler(async (req, res, next) => {
  const appointment = await chartService.getAppointmentReportData();

  return !appointment
    ? next(new ErrorHandler("Appointment Report Not Found"))
    : SuccessHandler(res, "Appointment Report Found", appointment);
});

exports.getAppointmentSale = AsyncHandler(async (req, res, next) => {
  const sales = await chartService.getAppointmentSaleData();

  return !sales
    ? next(new ErrorHandler("Appointment Sale not Found"))
    : SuccessHandler(res, "Appointment Sales per week Found", sales);
});

exports.getDeliveryType = AsyncHandler(async (req, res, next) => {
  const delivery = await chartService.getDeliveryTypeData();

  return !delivery
    ? next(new ErrorHandler("Delivery Report Not Found"))
    : SuccessHandler(res, "Delivery Reports Found", delivery);
});

exports.getProductType = AsyncHandler(async (req, res, next) => {
  const product = await chartService.getProductCountData();

  return !product
    ? next(new ErrorHandler("Product Reports Not Found"))
    : SuccessHandler(res, "Product Report Found", product);
});

exports.getScheduleCount = AsyncHandler(async (req, res, next) => {
  const schedule = await chartService.getScheduleCountsData();

  return !schedule
    ? next(new ErrorHandler("Schedule Report not Found"))
    : SuccessHandler(res, "Schedule Reports Found", schedule);
});

exports.getCommentRating = AsyncHandler(async (req, res, next) => {
  const comment = await chartService.getRatingCountsData();

  return !comment
    ? next(new ErrorHandler("Comment Ratings not Found"))
    : SuccessHandler(res, "Comment Rating Found", comment);
});

exports.getPaymentMethod = AsyncHandler(async (req, res, next) => {
  const payment = await chartService.getPaymentMethodCountData();

  return !payment
    ? next(new ErrorHandler("Payment Reports Not Found"))
    : SuccessHandler(res, "Payment Reports Found", payment);
});

exports.getFeedbackCount = AsyncHandler(async (req, res, next) => {
  const feedback = await chartService.getFeedbackCountData();

  return !feedback
    ? next(new ErrorHandler("No feedback found"))
    : SuccessHandler(res, "Feedback Reports Found", feedback);
});

exports.getBrandProduct = AsyncHandler(async (req, res, next) => {
  const brand = await chartService.getBrandProductData();

  return !brand
    ? next(new ErrorHandler("Brand Product Reports not found"))
    : SuccessHandler(res, "Brand Product Reports Found", brand);
});

exports.getAnonymousComment = AsyncHandler(async (req, res, next) => {
  const comment = await chartService.getAnonymousCommentData();

  return !comment
    ? next(new ErrorHandler("Anonymous Comment Reports Not Found"))
    : SuccessHandler(res, "Anonymous Comment Reports Found", comment);
});

exports.getAnonymousFeedback = AsyncHandler(async (req, res, next) => {
  const feedback = await chartService.getFeedbackAnonymousData();

  return !feedback
    ? next(new ErrorHandler("Anonymous feedback Reports Not Found"))
    : SuccessHandler(res, "Anonymous feedback Reports Found", feedback);
});

exports.getTransactionReservation = AsyncHandler(async (req, res, next) => {
  const reservation = await chartService.getReservationReportData();

  return !reservation
    ? next(new ErrorHandler("Reservation Reports Not Found"))
    : SuccessHandler(res, "Reservation Fee Reports Found", reservation);
});

exports.getTransactionCustomerType = AsyncHandler(async (req, res, next) => {
  const customer = await chartService.transactionCustomerTypeData();

  return !customer
    ? next(new ErrorHandler("Transaction Report Customers not Found"))
    : SuccessHandler(res, "Transaction Customer type Found", customer);
});
