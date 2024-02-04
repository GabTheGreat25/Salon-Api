const Month = require("../models/month");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { STATUSCODE } = require("../constants/index");

exports.getAllMonthData = async () => {
  const months = await Month.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .lean()
    .exec();

  return months;
};

exports.getSingleMonthData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid month ID: ${id}`);

  const month = await Month.findById(id).lean().exec();

  if (!month) throw new ErrorHandler(`Month not found with ID: ${id}`);

  return month;
};

exports.createMonthData = async (req, res) => {
  const month = await Month.create({
    ...req.body,
  });

  return month;
};

exports.updateMonthData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid month ID: ${id}`);

  const existingMonth = await Month.findById(id).lean().exec();

  if (!existingMonth) throw new ErrorHandler(`Month not found with ID: ${id}`);

  const updatedMonth = await Month.findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .lean()
    .exec();

  return updatedMonth;
};

exports.deleteMonthData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid month ID ${id}`);

  const month = await Month.findOne({
    _id: id,
  });

  if (!month) throw new ErrorHandler(`Month not found with ID: ${id}`);

  await Promise.all([
    Month.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return month;
};
