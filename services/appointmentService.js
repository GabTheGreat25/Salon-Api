const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const Comment = require("../models/comment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { ROLE } = require("../constants");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");
const { sendSMS } = require("../utils/twilio");

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

exports.getAllAppointmentsData = async () => {
  const appointments = await Appointment.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "beautician customer",
      select: "name roles contact_number",
    })
    .populate({ path: "service", select: "service_name image" })
    .lean()
    .exec();
  return appointments;
};

exports.getSingleAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findById(id)
    .populate({
      path: "beautician customer",
      select: "name roles contact_number",
    })
    .populate({ path: "service", select: "service_name image" })
    .lean()
    .exec();

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return appointment;
};

exports.createAppointmentData = async (req, res) => {
  let appointment;

  const existingAppointments = await Appointment.find({
    date: req.body.date,
    time: { $in: req.body.time },
  });

  if (existingAppointments.length > 0)
    throw new ErrorHandler(
      "Appointment slot is already booked by another customer."
    );

  appointment = await Appointment.create({
    ...req.body,
  });

  await Appointment.populate(appointment, [
    { path: "beautician customer", select: "name roles contact_number" },
    { path: "service", select: "service_name image" },
  ]);

  const currentDate = new Date();
  const appointmentDateTime = new Date(
    `${req.body.date} ${currentDate.toLocaleTimeString("en-Ph", {
      hour12: true,
    })}`
  );

  const deletionTimeForOnlineCustomer =
    // appointmentDateTime.getTime() - 1 * 60 * 1000;
    appointmentDateTime.getTime() - 60 * 60 * 1000;
  const deletionTimeForWalkInCustomer =
    appointmentDateTime.getTime() - 30 * 60 * 1000;

  let transaction;

  if (req.body.payment === "Cash")
    transaction = await Transaction.create({
      appointment: appointment._id,
      status: req.body.status,
      payment: req.body.payment,
    });
  await appointment.save();
  appointment.transaction = transaction._id;
  await transaction.save();

  const verification = await Verification.create({
    transaction: appointment.transaction,
    confirm: false,
  });

  const customerRoles = appointment.customer.roles;

  if (customerRoles.includes(ROLE.ONLINE_CUSTOMER)) {
    setTimeout(async () => {
      await deleteAppointmentAfterTimeout(appointment._id, verification);
    }, Math.max(0, deletionTimeForOnlineCustomer - currentDate.getTime()));
  }

  if (customerRoles.includes(ROLE.WALK_IN_CUSTOMER)) {
    setTimeout(async () => {
      await deleteAppointmentAfterTimeout(appointment._id, verification);
    }, Math.max(0, deletionTimeForWalkInCustomer - currentDate.getTime()));
  }

  const smsMessage = `Dear ${appointment.customer.name}, your appointment was successfully booked. Please wait for the admin to review and confirm. Thank you for choosing Lhanlee Salon.`;

  await sendSMS(
    `+63${appointment.customer.contact_number.substring(1)}`,
    smsMessage
  );

  return { appointment, transaction, verification };
};

exports.updateAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    {
      ...req.body,
      service: serviceValues,
      beautician: beauticianValues,
      time: timeValues,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: "beautician customer",
      select: "name roles contact_number",
    })
    .populate({ path: "service", select: "service_name image" })
    .lean()
    .exec();

  if (!updatedAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return updatedAppointment;
};

exports.updateScheduleAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const existingAppointmentsWithSameDateTime = await Appointment.find({
    date: req.body.date,
    time: { $in: req.body.time },
    _id: { $ne: id },
  });

  const existingTransactions = await Transaction.find({
    appointment: {
      $in: existingAppointmentsWithSameDateTime.map(
        (appointment) => appointment._id
      ),
    },
    status: { $in: ["cancelled", "pending", "completed"] },
  });

  const isSlotBooked = existingTransactions.some((transaction) => {
    return (
      transaction.status !== "cancelled" &&
      transaction.appointment.toString() !== id
    );
  });

  if (isSlotBooked) {
    throw new ErrorHandler(
      "Appointment slot is already booked by another customer."
    );
  }

  const updatedScheduleAppointment = await Appointment.findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: "beautician customer",
      select: "name roles contact_number",
    })
    .populate({ path: "service", select: "service_name image" })
    .lean()
    .exec();

  if (!updatedScheduleAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return updatedScheduleAppointment;
};

exports.deleteAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findOne({
    _id: id,
  });

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  const appointmentId = appointment?._id;

  const transaction = await Transaction.findOne({
    appointment: appointmentId,
  });

  const transactionId = transaction?._id;

  await Promise.all([
    Appointment.deleteOne({ _id: id }).lean().exec(),
    Transaction.deleteMany({ appointment: appointmentId }).lean().exec(),
    Verification.deleteMany({ transaction: transactionId }).lean().exec(),
    Comment.deleteMany({ transaction: transactionId }).lean().exec(),
  ]);

  return appointment;
};

exports.getBeauticianAppointmentsData = async (id) => {
  const beauticianAppointments = await Appointment.find({ beautician: id })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (!beauticianAppointments || beauticianAppointments.length === 0) {
    return next(new ErrorHandler("No Appointments Found for Beautician"));
  }

  const appointmentIds = beauticianAppointments.map(
    (appointment) => appointment._id
  );

  const transactions = await Transaction.find({
    appointment: { $in: appointmentIds },
    status: "pending",
  })
    .collation({ locale: "en" })
    .populate({
      path: "appointment",
      select: "date time price  customer service",
      populate: [
        {
          path: "customer",
          select: "name image",
        },
        {
          path: "service",
          select: "service_name description price",
        },
      ],
    })
    .lean()
    .exec();

  return transactions;
};

exports.appointmentHistoryData = async (id) => {
  const beauticianAppointments = await Appointment.find({ beautician: id })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (!beauticianAppointments || beauticianAppointments.length === 0) {
    return next(new ErrorHandler("No Appointments Found for Beautician"));
  }

  const appointmentIds = beauticianAppointments.map(
    (appointment) => appointment._id
  );

  const history = await Transaction.find({
    appointment: { $in: appointmentIds },
    status: "completed",
  })
    .collation({ locale: "en" })
    .populate({
      path: "appointment",
      select: "date time price service customer",
      populate: [
        {
          path: "customer",
          select: "name image",
        },
        {
          path: "service",
          select: "service_name description price",
        },
      ],
    })
    .lean()
    .exec();

  return history;
};
