const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const Comment = require("../models/comment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants");
const { sendSMS } = require("../utils/twilio");
const moment = require("moment-timezone");

const deleteAppointmentAfterTimeout = async (appointmentId, verification) => {
  const appointment = await Appointment.findById(appointmentId);

  if (appointment && verification && verification.confirm === false) {
    await Promise.all([
      Appointment.findByIdAndDelete(appointmentId).lean().exec(),
      Transaction.deleteMany({ appointment: appointmentId }).lean().exec(),
      Verification.deleteMany({ transaction: verification._id }).lean().exec(),
    ]);
  }
  console.log("Appointment Deleted:", appointmentId);
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
        select: "product_name brand ingredients",
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
        select: "product_name brand ingredients",
      },
    })
    .populate({
      path: "option",
      select: "option_name extraFee",
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

  const currentTimePH = moment().tz("Asia/Manila").add(8, "hours");

  const appointmentTime = req.body.time;

  const appointmentTimeDate = moment(
    `${req.body.date} ${appointmentTime}`,
    "YYYY-MM-DD HH:mm A"
  )
    .tz("Asia/Manila")
    .add(8, "hours");
  if (appointmentTimeDate.isBefore(currentTimePH)) {
    throw new ErrorHandler("Cannot book appointment in the past.");
  }

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

  await appointment.save();

  const retrievedAppointment = await Appointment.findById(appointment._id);

  if (!retrievedAppointment) throw new ErrorHandler("Appointment not found.");

  const firstTime = retrievedAppointment.time[0];
  const [time, period] = firstTime.split(" ");
  const [hours, minutes] = time.split(":");
  let formattedHours = parseInt(hours);
  if (period === "PM" && formattedHours !== 12) {
    formattedHours += 12;
  }
  const formattedTime = `${formattedHours}:${minutes}:00.000Z`;

  const appointmentDateTime = new Date(`${req.body.date} ${formattedTime}`);

  let transaction;

  transaction = await Transaction.create({
    appointment: appointment._id,
    status: req.body.status,
    payment: req.body.payment,
    customer_type: req.body.customer_type,
    image: image,
  });

  appointment.transaction = transaction._id;
  await transaction.save();

  const verification = await Verification.create({
    transaction: appointment.transaction,
    confirm: false,
  });

  const smsMessage = `Dear ${appointment.customer.name}, your appointment was successfully booked. Thank you for choosing Lhanlee Salon.`;
  console.log(smsMessage);
  // await sendSMS(
  //   `+63${appointment.customer.contact_number.substring(1)}`,
  //   smsMessage
  // );

  const reminderTime = moment(appointmentDateTime)
    .subtract(2, "hours")
    .toDate();

  const deletionTimeForOnlineCustomer = moment(appointmentDateTime)
    .subtract(1, "hours")
    .toDate();

  const deletionTimeForWalkInCustomer = moment(appointmentDateTime)
    .subtract(30, "minutes")
    .toDate();

  setTimeout(async () => {
    const smsMessage = `Dear ${appointment.customer.name}, Just to remind you your appointment is in 2 hours.`;
    console.log(smsMessage);
    // await sendSMS(
    //   `+63${appointment.customer.contact_number.substring(1)}`,
    //   smsMessage
    // );
  }, Math.max(0, reminderTime.getTime() - currentTimePH.valueOf()));

  const hasAppointmentFee = retrievedAppointment.hasAppointmentFee;

  if (hasAppointmentFee === true) {
    setTimeout(async () => {
      const smsMessage = `Dear ${appointment.customer.name}, Your appointment has been deleted due to not paying the fee.`;
      console.log(smsMessage);
      // await sendSMS(
      //   `+63${appointment.customer.contact_number.substring(1)}`,
      //   smsMessage
      // );
      await deleteAppointmentAfterTimeout(appointment._id, verification);
    }, Math.max(0, deletionTimeForOnlineCustomer.getTime() - currentTimePH.valueOf()));
  } else {
    setTimeout(async () => {
      const smsMessage = `Dear ${appointment.customer.name}, Your appointment has been deleted due to not paying the fee.`;
      console.log(smsMessage);
      // await sendSMS(
      //   `+63${appointment.customer.contact_number.substring(1)}`,
      //   smsMessage
      // );
      await deleteAppointmentAfterTimeout(appointment._id, verification);
    }, Math.max(0, deletionTimeForWalkInCustomer.getTime() - currentTimePH.valueOf()));
  }

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

exports.getSingleRescheduleAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findById(id)
    .populate({
      path: "customer",
      select: "name contact_number",
    })
    .populate({
      path: "service",
      select:
        "service_name description price type occassion duration image product",
      populate: {
        path: "product",
        select: "product_name brand ingredients",
      },
    })
    .populate({
      path: "option",
      select: "option_name extraFee",
    })
    .lean()
    .exec();

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return appointment;
};
