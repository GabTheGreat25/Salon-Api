const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const {
  STATUSCODE,
  RESOURCE
} = require("../constants/index");

exports.getAllTransactionData = async () => {
  const transactions = await Transaction.find().sort({
    createdAt: STATUSCODE.NEGATIVE_ONE
  }).populate([{
      path: "customer",
      select: "name",
    },
    {
      path: RESOURCE.APPOINTMENT,
      select: "date time",
    },
  ]).lean().exec();

  return transactions;
};

exports.getSingleTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findById(id)
    .populate([{
        path: "customer",
        select: "name",
      },
      {
        path: RESOURCE.APPOINTMENT,
        select: "date time",
      },
    ])
    .lean()
    .exec();

  if (!transaction) throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  return transaction;
};

exports.createTransactionData = async (req, res) => {
  const transaction = await Transaction.create(req.body);

  await Transaction.populate(transaction, [
    { path: "customer", select: "name" },
    { path: RESOURCE.APPOINTMENT, select: "date time" }
  ]);

  const createVerification = await Verification.create({
    transaction: transaction?._id,
  });

  return { transaction, createVerification };
};

  exports.updateTransactionData = async (req, res, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new ErrorHandler(`Invalid transaction ID: ${id}`);

    const newStatus = req.body.status;

    const confirm = newStatus === "completed";

    const existingTransaction = await Transaction.findOneAndUpdate(
      { _id: id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({ path: "customer", select: "name" })
      .populate({ path: RESOURCE.APPOINTMENT, select: "date time" })
      .lean()
      .exec();

    if (!existingTransaction) throw new ErrorHandler(`Transaction not found with ID: ${id}`);

    const updateVerification = await Verification.findOneAndUpdate(
      { transaction: id },
      { confirm: confirm },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!verification) throw new ErrorHandler(`Verification record not found for transaction: ${id}`);

    return { existingTransaction, updateVerification };
  };

exports.deleteTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findOne({
    _id: id
  });
  if (!transaction) throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  await Promise.all([
    Transaction.deleteOne({
      _id: id
    })
    .populate({ path: "customer", select: "name" })
    .populate({ path: RESOURCE.APPOINTMENT, select: "date time" })
    .lean()
    .exec(),
    Verification.deleteMany({ transaction: id }).lean().exec(),
  ]);

  return transaction;
};