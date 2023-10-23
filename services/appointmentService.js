const Appointment = require("../models/appointment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllAppointmentsData = async () => {
  const appointments = await Appointment.find()
    .sort({ createdAt: -1 })
    .populate({ path: "employee customer", select: "name" })
    .populate({ path: "service", select: "service_name" })
    .lean()
    .exec();

  return appointments;
};

exports.getSingleAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findById(id)
    .populate({ path: "employee customer", select: "name" })
    .populate({ path: "service", select: "service_name" })
    .lean()
    .exec();

  if (!appointment) throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return appointment;
};

exports.createAppointmentData = async (req, res) => {
    const appointment = await Appointment.create(req.body);

    await Appointment.populate(appointment, [
        { path: "employee customer", select: "name" },
        { path: "service", select: "service_name" }
      ]);

    return appointment;
  };

exports.updateAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const updatedAppointment = await Appointment.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "employee customer", select: "name" })
    .populate({ path: "service", select: "service_name" })
    .lean()
    .exec();

  if (!updatedAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return updatedAppointment;
};

exports.deleteAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  if (!id) throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  const appointment = await Appointment.findOneAndDelete({ _id: id })
    .populate({ path: "employee customer", select: "name" })
    .populate({ path: "service", select: "service_name" })
    .lean()
    .exec();

  return appointment;
};
