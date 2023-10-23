const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const appointmentsService = require("../services/appointmentService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllAppointments = asyncHandler(async (req, res, next) => {
  const appointments = await appointmentsService.getAllAppointmentsData();

  return appointments?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No appointments found"))
    : SuccessHandler(
        res,
        `Appointments with appointment of ${appointments
          .map((u) => u?.customer?.name)
          .join(", ")} and IDs ${appointments
          .map((u) => u?._id)
          .join(", ")} retrieved`,
        appointments
      );
});

exports.getSingleAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await appointmentsService.getSingleAppointmentData(req.params.id);

  return !appointment
    ? next(new ErrorHandler("No appointment found"))
    : SuccessHandler(
        res,
        `Appointment of ${appointment?.customer?.name} with ID ${appointment?._id} retrieved`,
        appointment
      );
});

exports.createNewAppointment = [
  checkRequiredFields(["service", "employee", "customer" ,"date", "time", "total_price", "note"]),
  asyncHandler(async (req, res, next) => {
    const appointment = await appointmentsService.createAppointmentData(req);

    return SuccessHandler(
      res,
      `New appointment of ${appointment?.customer?.name} created with an ID ${appointment?._id}`,
      appointment
    );
  }),
];

exports.updateAppointment = [
  checkRequiredFields(["service", "employee", "customer" ,"date", "time", "total_price", "note"]),
  asyncHandler(async (req, res, next) => {
    const appointment = await appointmentsService.updateAppointmentData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Appointment of ${appointment?.customer?.name} with ID ${appointment?._id} is updated`,
      appointment
    );
  }),
];

exports.deleteAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await appointmentsService.deleteAppointmentData(req.params.id);

  return !appointment
    ? next(new ErrorHandler("No appointment found"))
    : SuccessHandler(
        res,
        `Appointment of ${appointment?.user?.name} with ID ${appointment?._id} is deleted`,
        appointment
      );
});
