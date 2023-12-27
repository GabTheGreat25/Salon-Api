const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { ROLE } = require("../constants");
const { cloudinary } = require("../utils/cloudinary");

const deleteAppointmentAfterTimeout = async (appointmentId, verification) => {
  const appointment = await Appointment.findById(appointmentId);

  if (appointment && verification && verification.confirm === false) {
    await Promise.all([
      Appointment.findByIdAndDelete(appointmentId).lean().exec(),
      Transaction.deleteMany({ appointment: appointmentId }).lean().exec(),
      Verification.deleteMany({ transaction: verification._id }).lean().exec(),
    ]);
  }
};

exports.getAllAppointmentsData = async (page, limit, search, sort, filter) => {
  const skip = (page - 1) * limit;

  let appointmentsQuery = Appointment.find();

  if (search) {
    const isNumericSearch = !isNaN(search);

    if (isNumericSearch) {
      const numericFields = ["price", "date", "time"];
      const numericFieldConditions = numericFields.map((field) => ({
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
    .populate({ path: "beautician customer", select: "name" })
    .populate({ path: "service", select: "service_name image" })
    .skip(skip)
    .limit(limit);

  return appointmentsQuery;
};

exports.getSingleAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findById(id)
    .populate({ path: "beautician customer", select: "name" })
    .populate({ path: "service", select: "service_name image" })
    .lean()
    .exec();

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return appointment;
};

exports.createAppointmentData = async (req, res) => {
  const currentDate = new Date();

  const serviceValues = Array.isArray(req.body.service)
    ? req.body.service
    : req.body.service.split(", ");

  const appointmentDateTime = new Date(`${req.body.date} ${req.body.time}`);
  const deletionTimeForOnlineCustomer =
    appointmentDateTime.getTime() - 60 * 60 * 1000;
  const deletionTimeForWalkInCustomer =
    appointmentDateTime.getTime() - 30 * 60 * 1000;

  let appointment;

  appointment = await Appointment.create({
    ...req.body,
    service: serviceValues,
  });

  await Appointment.populate(appointment, [
    { path: "beautician customer", select: "name roles" },
    { path: "service", select: "service_name image" },
  ]);

  let images = [];
  let transaction;

  if (req.body.payment === "Gcash") {
    if (req.files && Array.isArray(req.files)) {
      images = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            public_id: file.filename,
          });
          return {
            public_id: result.public_id,
            url: result.secure_url,
            originalname: file.originalname,
          };
        })
      );
    }

    transaction = await Transaction.create({
      appointment: appointment._id,
      status: req.body.status,
      payment: req.body.payment,
      image: images,
    });

    appointment.transaction = transaction._id;
    await appointment.save();

    transaction.image = images;
    await transaction.save();
  } else if (req.body.payment === "Cash") {
    transaction = await Transaction.create({
      appointment: appointment._id,
      status: req.body.status,
      payment: req.body.payment,
    });

    appointment.transaction = transaction._id;
    await appointment.save();
  } else {
    throw new Error("Invalid payment method");
  }

  const verification = await Verification.create({
    transaction: appointment.transaction,
    confirm: false,
  });

  const customerRoles = appointment.customer.roles;

  if (customerRoles.includes(ROLE.ONLINE_CUSTOMER)) {
    setTimeout(async () => {
      await deleteAppointmentAfterTimeout(appointment, verification);
    }, Math.max(0, deletionTimeForOnlineCustomer - currentDate.getTime()));
  } else if (customerRoles.includes(ROLE.WALK_IN_CUSTOMER)) {
    setTimeout(async () => {
      await deleteAppointmentAfterTimeout(appointment, verification);
    }, Math.max(0, deletionTimeForWalkInCustomer - currentDate.getTime()));
  }

  return { appointment, transaction, verification };
};

exports.updateAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const serviceValues = Array.isArray(req.body.service)
    ? req.body.service
    : req.body.service.split(", ");

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    {
      ...req.body,
      service: serviceValues,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({ path: "beautician customer", select: "name" })
    .populate({ path: "service", select: "service_name image" })
    .lean()
    .exec();

  if (!updatedAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return updatedAppointment;
};

exports.deleteAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findOne({
    _id: id,
  });

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  await Promise.all([
    Appointment.deleteOne({ _id: id })
      .lean()
      .exec()
      .populate({ path: "beautician customer", select: "name" })
      .populate({ path: "service", select: "service_name image" }),
    Transaction.deleteMany({ appointment: id }).lean().exec(),
    Verification.deleteMany({ transaction: appointment.transaction })
      .lean()
      .exec(),
  ]);

  return appointment;
};
