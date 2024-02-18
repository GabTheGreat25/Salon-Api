const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const appointmentsService = require("../services/appointmentService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");
const { upload } = require("../utils/cloudinary");

exports.getAllAppointments = asyncHandler(async (req, res, next) => {
  const appointments = await appointmentsService.getAllAppointmentsData();
  return appointments?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No appointments found"))
    : SuccessHandler(
        res,
        `Appointments of ${appointments
          .map((appointment) => appointment?.customer?.name)
          .join(", ")} and IDs ${appointments
          .map((appointment) => appointment?._id)
          .join(", ")} retrieved`,
        appointments
      );
});
exports.getSingleAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await appointmentsService.getSingleAppointmentData(
    req.params.id
  );
  return !appointment
    ? next(new ErrorHandler("No appointment found"))
    : SuccessHandler(
        res,
        `Appointment of ${appointment?.customer?.name} with ID ${appointment?._id} retrieved`,
        appointment
      );
});

exports.createNewAppointment = [
  upload.array("image"),
  checkRequiredFields([
    "service",
    "beautician",
    "customer",
    "date",
    "time",
    "price",
  ]),
  asyncHandler(async (req, res, next) => {
    const { appointment, transaction, verification } =
      await appointmentsService.createAppointmentData(req);

    return SuccessHandler(
      res,
      `New appointment of ${appointment?.customer?.name} created with an ID ${appointment?._id}`,
      { appointment, transaction, verification }
    );
  }),
];

exports.confirmRebook = asyncHandler(async (req, res, next) => {
  const appointmentId = req.params.id;

  await appointmentsService.confirmRebooked(appointmentId);

  SuccessHandler(
    res,
    `Customer's Rebook has been approved by the admin.`,
    appointmentId
  );
});

exports.updateAppointment = [
  checkRequiredFields(["service", "price"]),
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

exports.cancelRebook = asyncHandler(async (req, res, next) => {
  const appointmentId = req.params.id;

  await appointmentsService.cancelRebooked(appointmentId);

  SuccessHandler(
    res,
    `Customer's Rebook has been denied by the admin.`,
    appointmentId
  );
});

exports.updateScheduleAppointment = [
  checkRequiredFields(["date"]),
  asyncHandler(async (req, res, next) => {
    const appointment = await appointmentsService.updateScheduleAppointmentData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Appointment schedule of ${appointment?.customer?.name} with ID ${appointment?._id} is updated`,
      appointment
    );
  }),
];

exports.updateBeauticianAppointment = [
  checkRequiredFields(["beautician"]),
  asyncHandler(async (req, res, next) => {
    const appointment =
      await appointmentsService.updateBeauticianAppointmentData(
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
  const appointment = await appointmentsService.getSingleAppointmentData(
    req.params.id
  );

  const customerName = appointment?.customer?.name || "Unknown";

  await appointmentsService.deleteAppointmentData(req.params.id);

  return !appointment
    ? next(new ErrorHandler("No appointment found"))
    : SuccessHandler(
        res,
        `Appointment of ${customerName} with ID ${appointment?._id} is deleted`,
        appointment
      );
});

exports.getBeauticianAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await appointmentsService.getBeauticianAppointmentsData(
    req.params.id
  );

  return !appointment
    ? next(new ErrorHandler("No beautician appointment found"))
    : SuccessHandler(res, `Appointment Data found`, appointment);
});

exports.getAppointmentHistory = asyncHandler(async (req, res, next) => {
  const history = await appointmentsService.appointmentHistoryData(
    req.params.id
  );

  return !history
    ? next(new ErrorHandler("No Pending Appointment records"))
    : SuccessHandler(res, `Finished Appointment Found`, history);
});
