const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE, RESOURCE } = require("../constants/index");
const QRCode = require("qrcode");

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

exports.getAllTransactionData = async (page, limit, search, sort, filter) => {
  const skip = (page - 1) * limit;

  let transactionsQuery = Transaction.find();

  if (search) {
    const isNumericSearch = !isNaN(search);

    const searchFields = ["status", "payment"];
    const numericFields = ["date", "time"];

    const conditions = [];

    if (!isNumericSearch) {
      conditions.push(
        ...searchFields.map((field) => ({
          [field]: {
            $regex: new RegExp(search, "i"),
          },
        }))
      );
    } else
      conditions.push(
        ...numericFields.map((field) => ({
          [field]: search,
        }))
      );

    transactionsQuery = transactionsQuery.or(conditions);
  }

  if (sort) {
    const [field, order] = sort.split(":");
    transactionsQuery = transactionsQuery.sort({
      [field]: order === "asc" ? 1 : -1,
    });
  } else {
    transactionsQuery = transactionsQuery.sort({
      createdAt: -1,
    });
  }

  if (filter) {
    const [field, value] = filter.split(":");
    transactionsQuery = transactionsQuery.where(field).equals(value);
  }

  transactionsQuery = transactionsQuery
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        { path: "beautician customer", select: "name" },
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
    .skip(skip)
    .limit(limit);

  return transactionsQuery;
};

exports.getSingleTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findById(id)
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        { path: "beautician customer", select: "name" },
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
      path: RESOURCE.APPOINTMENT,
      populate: [
        { path: "beautician customer", select: "name" },
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
      { confirm: false },
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
      ` Reference ID: ${existingTransaction._id}\n` +
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
      `----------------------------------------\n` +
      ` This receipt is an official proof of payment.\n` +
      ` Please keep it for your reference (Reference ID: ${existingTransaction._id})\n` +
      ` in case of any future inquiries or problems.\n` +
      `========================================`;

    updatedTransaction.qrCode = await generatePinkQRCode(formattedReceipt);
    await updatedTransaction.save();

    return { existingTransaction, updatedTransaction, updateVerification };
  }
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
          select: "name",
        },
        populate: {
          path: "service",
          select: "service_name price image",
        },
        select: "date time price extraFee note",
      })
      .lean()
      .exec(),
    Verification.deleteMany({ transaction: id }).lean().exec(),
  ]);

  return transaction;
};
