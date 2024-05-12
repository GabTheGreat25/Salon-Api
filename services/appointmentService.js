const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const Comment = require("../models/comment");
const User = require("../models/user");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE, ROLE, RESOURCE } = require("../constants");
const { sendSMS } = require("../utils/twilio");
const moment = require("moment-timezone");

const getAdminUsers = async () => {
  const admins = await User.find({ roles: ROLE.ADMIN });
  return admins;
};

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
    .sort({ createdAt: STATUSCODE.NEGATIVE_ONE })
    .populate({
      path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
      select: "name roles contact_number image",
    })
    .populate({
      path: RESOURCE.SERVICE,
      select:
        "service_name description price type occassion duration image product",
      populate: {
        path: RESOURCE.PRODUCT,
        select: "product_name brand ingredients",
      },
    })
    .populate({ path: RESOURCE.OPTION, select: "option_name extraFee" })
    .lean()
    .exec();
  return appointments;
};

exports.getSingleAppointmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid appointment ID: ${id}`);

  const appointment = await Appointment.findById(id)
    .populate({
      path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
      select: "name roles contact_number image",
    })

    .populate({
      path: RESOURCE.SERVICE,
      select:
        "service_name description price type occassion duration image product",
      populate: {
        path: RESOURCE.PRODUCT,
        select: "product_name brand ingredients",
      },
    })
    .populate({
      path: RESOURCE.OPTION,
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
      path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
      select: "name roles contact_number",
    })
    .populate({ path: RESOURCE.SERVICE, select: "service_name image" })
    .populate({ path: RESOURCE.OPTION, select: "option_name extraFee" })
    .lean()
    .exec();

  if (!updatedAppointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return updatedAppointment;
};

exports.createAppointmentData = async (req, res) => {
  let appointment;

  const currentTimePH = moment()
    .tz("Asia/Manila")
    .add(STATUSCODE.EIGHT, "hours");

  const appointmentTime = req.body.time;

  const appointmentTimeDate = moment(
    `${req.body.date} ${appointmentTime}`,
    "YYYY-MM-DD HH:mm A"
  )
    .tz("Asia/Manila")
    .add(STATUSCODE.EIGHT, "hours");
  if (appointmentTimeDate.isBefore(currentTimePH))
    throw new ErrorHandler("Cannot book appointment in the past.");

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
    {
      path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
      select: "name roles contact_number",
    },
    { path: RESOURCE.SERVICE, select: "service_name image" },
    { path: RESOURCE.OPTION, select: "option_name extraFee" },
  ]);

  await appointment.save();

  const retrievedAppointment = await Appointment.findById(appointment._id);

  if (!retrievedAppointment) throw new ErrorHandler("Appointment not found.");

  const firstTime = retrievedAppointment.time[STATUSCODE.ZERO];
  const [time, period] = firstTime.split(" ");
  const [hours, minutes] = time.split(":");
  let formattedHours = parseInt(hours);
  if (period === "PM" && formattedHours !== STATUSCODE.TWELVE) {
    formattedHours += STATUSCODE.TWELVE;
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
  sendSMS(
    `+63${appointment.customer.contact_number.substring(STATUSCODE.ONE)}`,
    smsMessage
  );

  const reminderTime = moment(appointmentDateTime)
    .subtract(STATUSCODE.TWO, "hours")
    .toDate();

  const deletionTimeForOnlineCustomer = moment(appointmentDateTime)
    .subtract(STATUSCODE.ONE, "hours")
    .toDate();

  const deletionTimeForWalkInCustomer = moment(appointmentDateTime)
    .subtract(STATUSCODE.THIRTY, "minutes")
    .toDate();

  setTimeout(async () => {
    const smsMessage = `Dear ${appointment.customer.name}, Just to remind you your appointment is in 2 hours.`;
    console.log(smsMessage);
    sendSMS(
      `+63${appointment.customer.contact_number.substring(STATUSCODE.ONE)}`,
      smsMessage
    );
  }, Math.max(STATUSCODE.ZERO, reminderTime.getTime() - currentTimePH.valueOf())); // 2hours

  const hasAppointmentFee = retrievedAppointment.hasAppointmentFee;

  if (hasAppointmentFee === true) {
    setTimeout(async () => {
      const smsMessage = `Dear ${appointment.customer.name}, Your appointment has been deleted due to not paying the fee.`;
      console.log(smsMessage);

      sendSMS(
        `+63${appointment.customer.contact_number.substring(STATUSCODE.ONE)}`,
        smsMessage
      );

      const admins = await getAdminUsers();
      const adminNumbers = admins.map((admin) => admin.contact_number);

      const smsAdminMessage = `Dear Admin ${admins?.name},
      This is to inform you that ${
        appointment?.customer?.name
      } has scheduled an Online Appointment on ${
        new Date(appointment?.date).toISOString().split("T")[0]
      } at exactly ${
        appointment?.time
      }. Please note that the customer has an appointment reminder 1 hour before their scheduled appointment time. If the customer does not attend their booked appointment, you have the option to delete their appointment. Otherwise, you can disregard this message. `;

      adminNumbers.forEach((number, index) => {
        console.log(smsAdminMessage);
        sendSMS(`+63${number.substring(STATUSCODE.ONE)}`, smsAdminMessage);
      });
    }, Math.max(STATUSCODE.ZERO, deletionTimeForOnlineCustomer.getTime() - currentTimePH.valueOf()));
  } else {
    setTimeout(async () => {
      const smsMessage = `Dear ${appointment.customer.name}, Your appointment has been deleted due to not paying the fee.`;
      console.log(smsMessage);
      sendSMS(
        `+63${appointment.customer.contact_number.substring(STATUSCODE.ONE)}`,
        smsMessage
      );

      const receptionist = await getAdminUsers();
      const receptionistNumbers = receptionist.map((r) => r.contact_number);

      const smsReceptionistMessage = `Dear ${
        receptionist?.name
      },This is to inform you that ${
        appointment?.customer?.name
      } has scheduled a Walk-In Appointment for ${
        new Date(appointment?.date).toISOString().split("T")[0]
      }at ${
        appointment?.time
      }. Please note that the appointment is in 30 minutes from now. If the customer does not attend their booked appointment, you have the option to delete their appointment. Otherwise, you can disregard this message.Best regards,`;

      receptionistNumbers.forEach((number, index) => {
        console.log(smsReceptionistMessage);
        sendSMS(`+63${number.substring(STATUSCODE.ONE)}`, smsAdminMessage);
      });
    }, Math.max(STATUSCODE.ZERO, deletionTimeForWalkInCustomer.getTime() - currentTimePH.valueOf()));
  }

  const admins = await getAdminUsers();
  const adminNames = admins.map((admin) => admin.name);
  const adminNumbers = admins.map((admin) => admin.contact_number);

  const smsAdminMessage = `New appointment created by ${
    appointment.customer.name
  } on ${
    new Date(appointment.date).toISOString().split("T")[STATUSCODE.ZERO]
  } at ${firstTime}. Please review and confirm. Thank you!`;

  console.log(smsAdminMessage);

  adminNumbers.forEach((number, index) => {
    console.log(`Sending SMS to ${adminNames[index]} at ${number}`);
    sendSMS(`+63${number.substring(STATUSCODE.ONE)}`, smsAdminMessage);
  });

  return { appointment, transaction, verification };
};

exports.confirmRebooked = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate(
    RESOURCE.CUSTOMER,
    "name contact_number"
  );

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${appointmentId}`);

  if (!appointment.isRebooked) {
    appointment.isRebooked = true;
    await appointment.save();

    const smsMessage = `Dear ${appointment.customer.name}, Your rebooked has been confirmed. Thank you for choosing Lhanlee Salon!`;

    console.log(smsMessage);

    sendSMS(
      `+63${appointment.customer.contact_number.substring(STATUSCODE.ONE)}`,
      smsMessage
    );
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
  ).populate(RESOURCE.CUSTOMER, "name contact_number");

  const smsMessage = `Dear ${updatedScheduleAppointment.customer.name}, Your appointment has been updated. Please wait for the admin to review and confirm. Thank you for choosing Lhanlee Salon!`;

  console.log(smsMessage);

  sendSMS(
    `+63${updatedScheduleAppointment.customer.contact_number.substring(
      STATUSCODE.ONE
    )}`,
    smsMessage
  );

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
      path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
      select: "name roles contact_number",
    })
    .populate({ path: RESOURCE.SERVICE, select: "service_name image" })
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
    sendSMS(
      `+63${updatedAppointment.customer.contact_number.substring(
        STATUSCODE.ONE
      )}`,
      smsMessage
    );
  }

  return updatedAppointment;
};

exports.cancelRebooked = async (appointmentId) => {
  const appointment = await Appointment.findById(appointmentId).populate(
    RESOURCE.CUSTOMER,
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

    sendSMS(
      `+63${appointment.customer.contact_number.substring(STATUSCODE.ONE)}`,
      smsMessage
    );

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

  if (
    !beauticianAppointments ||
    beauticianAppointments.length === STATUSCODE.ZERO
  )
    throw new ErrorHandler("No Appointments Found for Beautician");

  const appointmentIds = beauticianAppointments.map(
    (appointment) => appointment._id
  );

  const transactions = await Transaction.find({
    appointment: { $in: appointmentIds },
    status: "pending",
  })
    .collation({ locale: "en" })
    .populate({
      path: RESOURCE.APPOINTMENT,
      select: "date time price  customer service",
      populate: [
        {
          path: RESOURCE.CUSTOMER,
          select: "name image",
        },
        {
          path: RESOURCE.SERVICE,
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

  if (
    !beauticianAppointments ||
    beauticianAppointments.length === STATUSCODE.ZERO
  )
    throw new ErrorHandler("No Appointments Found for Beautician");

  const appointmentIds = beauticianAppointments.map(
    (appointment) => appointment._id
  );

  const history = await Transaction.find({
    appointment: { $in: appointmentIds },
    status: "completed",
  })
    .collation({ locale: "en" })
    .populate({
      path: RESOURCE.APPOINTMENT,
      select: "date time price service customer",
      populate: [
        {
          path: RESOURCE.CUSTOMER,
          select: "name image",
        },
        {
          path: RESOURCE.SERVICE,
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
      path: RESOURCE.CUSTOMER,
      select: "name contact_number",
    })
    .populate({
      path: RESOURCE.SERVICE,
      select:
        "service_name description price type occassion duration image product",
      populate: {
        path: RESOURCE.PRODUCT,
        select: "product_name brand ingredients",
      },
    })
    .populate({
      path: RESOURCE.OPTION,
      select: "option_name extraFee",
    })
    .lean()
    .exec();

  if (!appointment)
    throw new ErrorHandler(`Appointment not found with ID: ${id}`);

  return appointment;
};
