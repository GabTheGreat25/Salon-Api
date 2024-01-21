const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const Appointment = require("../models/appointment");
const Comment = require("../models/comment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE, RESOURCE } = require("../constants/index");
const QRCode = require("qrcode");
const { sendSMS } = require("../utils/twilio");

const generatePinkQRCode = async (data) => {
  const qrOptions = {
    color: {
      dark: "#000",
      light: "#FDA7DF",
    },
  };

  const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);

  return qrCodeDataUrl;
};

exports.getAllTransactionData = async () => {
  const transactions = await Transaction.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        { path: "beautician customer", select: "name contact_number" },
        {
          path: "service",
          select: "service_name price image",
          populate: {
            path: "product",
            select: "product_name type brand isNew",
          },
        },
      ],
      select: "date time price extraFee note",
    })
    .lean()
    .exec();
  return transactions;
};

exports.getSingleTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findById(id)
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        { path: "beautician customer", select: "name contact_number" },
        {
          path: "service",
          select: "service_name price image",
          populate: {
            path: "product",
            select: "product_name type brand isNew",
          },
        },
      ],
      select: "date time price extraFee note",
    })
    .lean()
    .exec();

  if (!transaction)
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  return transaction;
};

exports.updateTransactionData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const newStatus = req.body.status;
  const existingTransaction = await Transaction.findById(id)
    .populate({
      path: "appointment",
      populate: [
        { path: "beautician customer", select: "name contact_number roles" },
        {
          path: "service",
          select: "service_name price image",
          populate: {
            path: "product",
            select: "product_name type brand isNew",
          },
        },
      ],
      select: "date time price extraFee note",
    })
    .lean()
    .exec();

  if (!existingTransaction)
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  const wasCompleted = existingTransaction.status === "completed";
  const confirm = newStatus === "completed";

  const updatedTransaction = await Transaction.findOneAndUpdate(
    { _id: id },
    req.body,
    {
      new: true,
      runValidators: true,
    }
  ).exec();

  let updateVerification;

  if (wasCompleted && !confirm) {
    updateVerification = await Verification.findOneAndUpdate(
      { transaction: updatedTransaction?._id },
      { confirm: req.body.status !== "completed" },
      {
        new: true,
        runValidators: true,
      }
    );
  } else {
    updateVerification = await Verification.findOneAndUpdate(
      { transaction: updatedTransaction?._id },
      { confirm: confirm },
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );
  }

  if (confirm) {
    const totalFee =
      existingTransaction.appointment.price +
      existingTransaction.appointment.extraFee;

    const formattedReceipt =
      `========================================\n` +
      `         APPOINTMENT RECEIPT           \n` +
      `----------------------------------------\n` +
      ` Date: ${
        existingTransaction.appointment.date.toISOString().split("T")[0]
      }\n` +
      ` Time: ${existingTransaction.appointment.time}\n` +
      `----------------------------------------\n` +
      `           Service Details              \n` +
      `----------------------------------------\n` +
      ` Service: ${
        existingTransaction.appointment.service.length > 1
          ? existingTransaction.appointment.service
              .map((s) => s.service_name)
              .join(", ")
          : existingTransaction.appointment.service[0]?.service_name
      }\n` +
      `----------------------------------------\n` +
      ` Beautician:\n` +
      `   Name: ${existingTransaction.appointment.beautician.name}\n` +
      `----------------------------------------\n` +
      ` Payment: ${updatedTransaction.payment}\n` +
      ` Total Fee: ${totalFee}\n` +
      `----------------------------------------\n` +
      ` Thank you for choosing our services, ${existingTransaction.appointment.customer.name}!\n` +
      ` Roles: ${existingTransaction.appointment.customer.roles.join(", ")}\n` +
      `----------------------------------------\n` +
      ` This receipt is an official proof of payment.\n` +
      ` Please keep it for your reference (Reference ID: ${existingTransaction._id})\n` +
      ` in case of any future inquiries or problems.\n` +
      `========================================`;

    updatedTransaction.qrCode = await generatePinkQRCode(formattedReceipt);

    const smsMessage = `Dear ${existingTransaction.appointment.customer.name}, your transaction has been approved! You can review your transaction details by checking your history. Thank you for choosing Lhanlee Salon.`;

    await sendSMS(
      `+63${existingTransaction.appointment.customer.contact_number.substring(
        1
      )}`,
      smsMessage
    );

    // setTimeout(async () => {
    //   const additionalSmsMessage = `Dear ${existingTransaction.appointment.customer.name}, it's been a while since your last visit. We miss you! Come and visit us again. Thank you for choosing Lhanlee Salon.`;

    //   await sendSMS(
    //     `+63${existingTransaction.appointment.customer.contact_number.substring(
    //       1
    //     )}`,
    //     additionalSmsMessage
    //   );
    // }, 2 * 60 * 1000); // 2minutes

    const delayInMilliseconds = 2 * 30 * 24 * 60 * 60 * 1000;
    const timeoutInterval = 2 * 60 * 60 * 1000;

    const sendSmsAfterDelay = async () => {
      const additionalSmsMessage = `Dear ${existingTransaction.appointment.customer.name}, it's been a while since your last visit. We miss you! Come and visit us again. Thank you for choosing Lhanlee Salon.`;

      await sendSMS(
        `+63${existingTransaction.appointment.customer.contact_number.substring(
          1
        )}`,
        additionalSmsMessage
      );
    };

    const runTimeouts = async () => {
      let remainingDelay = delayInMilliseconds;

      while (remainingDelay > 0) {
        const currentDelay = Math.min(remainingDelay, timeoutInterval);
        await new Promise((resolve) => setTimeout(resolve, currentDelay));

        await sendSmsAfterDelay();

        remainingDelay -= currentDelay;
      }
    };

    runTimeouts();

    await updatedTransaction.save();
  } else {
    updatedTransaction.qrCode = "";
    await updatedTransaction.save();
  }

  return { existingTransaction, updatedTransaction, updateVerification };
};

exports.updateCustomerTransactionData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);
  }

  const existingTransaction = await Transaction.findById(id)
    .populate({
      path: "appointment",
      populate: [
        { path: "beautician customer", select: "name contact_number roles" },
        {
          path: "service",
          select: "service_name price image",
          populate: {
            path: "product",
            select: "product_name type brand isNew",
          },
        },
      ],
      select: "date time price extraFee note",
    })
    .lean()
    .exec();

  if (!existingTransaction) {
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);
  }

  const updatedTransaction = await Transaction.findOneAndUpdate(
    { _id: id },
    {
      status: req.body.status,
      cancelReason: req.body.cancelReason,
    },
    { new: true, runValidators: true }
  ).exec();

  return { existingTransaction, updatedTransaction };
};

exports.deleteTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findOne({
    _id: id,
  });

  if (!transaction)
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  await Promise.all([
    Transaction.deleteOne({
      _id: id,
    })
      .populate({
        path: RESOURCE.APPOINTMENT,
        populate: {
          path: "beautician customer",
          select: "name contact_number",
        },
        populate: {
          path: "service",
          select: "service_name price image",
        },
        select: "date time price extraFee note",
      })
      .lean()
      .exec(),
    Appointment.deleteOne({ _id: transaction.appointment }).lean().exec(),
    Verification.deleteMany({ transaction: id }).lean().exec(),
    Comment.deleteMany({ transaction: id }).lean().exec(),
  ]);

  return transaction;
};
