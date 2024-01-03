const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE, RESOURCE } = require("../constants/index");

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
      populate: {
        path: "beautician customer",
        select: "name",
      },
      populate: {
        path: "service",
        select: "service_name image",
      },
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
      populate: {
        path: "beautician customer",
        select: "name",
      },
      populate: {
        path: "service",
        select: "service_name image",
      },
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
  const existingTransaction = await Transaction.findById(id).lean().exec();

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
  )
    .lean()
    .exec();

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

  return { existingTransaction, updatedTransaction, updateVerification };
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
          select: "service_name image",
        },
        select: "date time price extraFee note",
      })
      .lean()
      .exec(),
    Verification.deleteMany({ transaction: id }).lean().exec(),
  ]);

  return transaction;
};
