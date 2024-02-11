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
    .populate({
      path: "service",
      select:
        "service_name description price type occassion duration image product",
      populate: {
        path: "product",
        select: "product_name brand",
      },
    })
    .populate({ path: "option", select: "option_name extraFee" })
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
    .populate({
      path: "service",
      select:
        "service_name description price type occassion duration image product",
      populate: {
        path: "product",
        select: "product_name brand",
      },
    })
    .lean()
    .exec();

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return appointment;
};

exports.updateAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const updatedAppointment = await Appointment.findByIdAndUpdate(
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
    .populate({ path: "option", select: "option_name extraFee" })
    .lean()
    .exec();

  if (!updatedAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return updatedAppointment;
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

  const originalData = {
    beautician: req.body.beautician || [],
    date: req.body.date || null,
    time: req.body.time || [],
  };

  let image = [];
  if (req.files && Array.isArray(req.files)) {
    image = await Promise.all(
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

  appointment = await Appointment.create({
    ...req.body,
    originalData,
  });

  await Appointment.populate(appointment, [
    { path: "beautician customer", select: "name roles contact_number" },
    { path: "service", select: "service_name image" },
    { path: "option", select: "option_name extraFee" },
  ]);

  const currentDate = new Date();
  const appointmentDateTime = new Date(
    `${req.body.date} ${currentDate.toLocaleTimeString("en-Ph", {
      hour12: true,
    })}`
  );

  const deletionTimeForOnlineCustomer =
    // appointmentDateTime.getTime() - 60 * 1000;
    appointmentDateTime.getTime() - 60 * 60 * 1000;
  const deletionTimeForWalkInCustomer =
    appointmentDateTime.getTime() - 30 * 60 * 1000;

  let transaction;

  if (req.body.payment === "Cash")
    transaction = await Transaction.create({
      appointment: appointment._id,
      status: req.body.status,
      payment: req.body.payment,
      image: image,
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

  const smsMessage = `Dear ${appointment.customer.name}, your appointment was successfully booked. Thank you for choosing Lhanlee Salon.`;
  console.log(smsMessage);
  // await sendSMS(
  //   `+63${appointment.customer.contact_number.substring(1)}`,
  //   smsMessage
  // );

  const reminderTime = appointmentDateTime.getTime() + 2 * 60 * 60 * 1000;

  setTimeout(async () => {
    const smsMessage = `Dear ${appointment.customer.name}, Just to remind you your appointment is in 2 hours.`;
    console.log(smsMessage);
    // await sendSMS(
    //   `+63${appointment.customer.contact_number.substring(1)}`,
    //   smsMessage
    // );
  }, Math.max(0, reminderTime - currentDate.getTime()));

  return { appointment, transaction, verification };
};

exports.confirmRebooked = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate(
    "customer",
    "name contact_number"
  );

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${appointmentId}`);

  if (!appointment.isRebooked) {
    appointment.isRebooked = true;
    await appointment.save();

    const smsMessage = `Dear ${appointment.customer.name}, Your rebooked has been confirmed. Thank you for choosing Lhanlee Salon!`;

    console.log(smsMessage);

    // await sendSMS(
    //   `+63${appointment.customer.contact_number.substring(1)}`,
    //   smsMessage
    // );
  } else throw new ErrorHandler(`Appointment is not marked for rebooking`);

  return appointment;
};

exports.updateScheduleAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findById(id);

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  appointment.originalData = {
    beautician: appointment.beautician,
    date: appointment.date,
    time: appointment.time,
  };

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

  if (isSlotBooked)
    throw new ErrorHandler(
      "Appointment slot is already booked by another customer."
    );

  const updatedScheduleAppointment = await Appointment.findByIdAndUpdate(
    id,
    { ...req.body, isRebooked: false },
    {
      new: true,
      runValidators: true,
    }
  ).populate("customer", "name contact_number");

  const smsMessage = `Dear ${updatedScheduleAppointment.customer.name}, Your appointment has been updated. Please wait for the admin to review and confirm. Thank you for choosing Lhanlee Salon!`;

  console.log(smsMessage);

  // await sendSMS(
  //   `+63${updatedScheduleAppointment.customer.contact_number.substring(1)}`,
  //   smsMessage
  // );

  return updatedScheduleAppointment;
};

exports.updateBeauticianAppointmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const originalAppointment = await Appointment.findById(id).lean().exec();

  if (!originalAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  const existingBeauticianCount = originalAppointment.beautician.length;

  if (
    req.body.beautician &&
    req.body.beautician.length !== existingBeauticianCount
  ) {
    throw new ErrorHandler(
      `Invalid number of beauticians. Please select exactly ${existingBeauticianCount} beautician(s) for the appointment.`
    );
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    id,
    { ...req.body },
    { new: true, runValidators: true }
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

  const originalBeauticians = originalAppointment.beautician.map((beautician) =>
    beautician.toString()
  );
  const updatedBeauticians = updatedAppointment.beautician.map((beautician) =>
    beautician.toString()
  );

  if (originalBeauticians.join() !== updatedBeauticians.join()) {
    const newBeauticians = updatedAppointment.beautician
      .map((beautician) => beautician.name)
      .join(", ");
    const smsMessage = `Dear ${updatedAppointment.customer.name}, your beautician(s) have been changed. Your new beautician(s) is/are: ${newBeauticians}. We understand that changes like these might impact your experience, and we sincerely apologize for any inconvenience caused. Our commitment is to ensure you receive the highest level of service, and we believe your new beautician(s) will provide you with an exceptional experience. Thank you for your understanding and continued trust in our salon. Should you have any questions or concerns, please feel free to reach out to us.`;

    console.log(smsMessage);
    // await sendSMS(`+63${updatedAppointment.customer.contact_number.substring(1)}`, smsMessage);
  }

  return updatedAppointment;
};

exports.cancelRebooked = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate(
    "customer",
    "name contact_number date"
  );

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${appointmentId}`);

  if (!appointment.isRebooked) {
    await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        beautician: appointment.originalData.beautician,
        date: appointment.originalData.date,
        time: appointment.originalData.time,
        isRebooked: true,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const smsMessage = `Dear ${appointment.customer.name}, Your rebooking has been denied. Your appointment has been reverted to its original date and time. Thank you for your understading!`;

    console.log(smsMessage);

    // await sendSMS(
    //   `+63${appointment.customer.contact_number.substring(1)}`,
    //   smsMessage
    // );

    const revertedAppointment = await Appointment.findById(appointmentId);

    return revertedAppointment;
  } else throw new ErrorHandler(`Appointment is not marked for rebooking`);
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
