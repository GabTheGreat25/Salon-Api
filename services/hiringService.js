const Hiring = require("../models/hiring");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE } = require("../constants/index");

exports.getAllHiringData = async () => {
  const hiring = await Hiring.find()
    .sort({
      createdAt: -1,
    })
    .lean()
    .exec();

  return hiring;
};

exports.getSingleHiringData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid hiring ID: ${id}`);

  const hiring = await Hiring.findById(id).lean().exec();

  if (!hiring) throw new ErrorHandler(`Hiring not found with ID: ${id}`);

  return hiring;
};

exports.createHiringData = async (req, res) => {

  const hiring = await Hiring.create({
    ...req.body,
  });

  return hiring;
};

exports.updateHiringData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid hiring ID: ${id}`);

  const existingHiring = await Hiring.findById(id).lean().exec();

  if (!existingHiring) throw new ErrorHandler(`Hiring not found with ID: ${id}`);

  const updatedHiring = await Hiring.findByIdAndUpdate(
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

  if (!updatedHiring) throw new ErrorHandler(`Hiring not found with ID: ${id}`);

  return updatedHiring;
};

exports.deleteHiringData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid hiring ID ${id}`);

  const hiring = await Hiring.findOne({
    _id: id,
  });
  if (!hiring) throw new ErrorHandler(`Hiring not found with ID: ${id}`);


  await Promise.all([
    Hiring.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return hiring;
};
