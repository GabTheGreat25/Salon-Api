const Appointment = require("../models/appointment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllAppointmentsData = async (page, limit, search, sort, filter) => {
  const skip = (page - 1) * limit;

  let appointmentsQuery = Appointment.find();

  if (search) {
    const isNumericSearch = !isNaN(search);

    if (isNumericSearch) {
      const numericFields = ["total_price", "date", "time"];
      const numericFieldConditions = numericFields.map(field => ({
        [field]: search,
      }));

      appointmentsQuery = appointmentsQuery.or(numericFieldConditions);
    }
  }

  if (sort) {
    const [field, order] = sort.split(":");
    appointmentsQuery = appointmentsQuery.sort({
      [field]: order === "asc" ? 1 : -1,
    });
  } else {
    appointmentsQuery = appointmentsQuery.sort({
      createdAt: -1,
    });
  }

  if (filter) {
    const [field, value] = filter.split(":");
    appointmentsQuery = appointmentsQuery.where(field).equals(value);
  }

  appointmentsQuery = appointmentsQuery
    .populate({ path: "employee customer", select: "name" })
    .populate({ path: "service", select: "service_name" })
    .skip(skip)
    .limit(limit);

  return appointmentsQuery;
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
