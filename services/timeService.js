const Time = require("../models/time");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllTimesData = async () => {
  const times = await Time.find()
    .sort({
      createdAt: -1,
    })
    .lean()
    .exec();

  return times;
};

exports.getOneTimeData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid time ID: ${id}`);

  const time = await Time.findById(id).lean().exec();

  if (!time) throw new ErrorHandler(`Time not found with ID ${id}`);

  return time;
};

exports.createTimeData = async (req, res) => {
  const duplicateTime = await Time.findOne({
    time: req.body.time,
  })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateTime) throw new ErrorHandler("Error Duplicate Time");

  const time = await Time.create({
    ...req.body,
  });

  return time;
};

exports.updateTimeData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid time ID: ${id}`);

  const existingTime = await Time.findById(id).lean().exec();

  if (!existingTime) throw new ErrorHandler(`Time not found with ID: ${id}`);

  const duplicateTime = await Time.findOne({
    time: req.body.time,
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateTime) throw new ErrorHandler("Duplicate Time");

  const updatedTime = await Time.findByIdAndUpdate(
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

  if (!updatedTime) throw new ErrorHandler(`Time not found with ID: ${id}`);

  return updatedTime;
};

exports.deleteTimeData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid time ID ${id}`);

  const time = await Time.findOne({
    _id: id,
  });
  if (!time) throw new ErrorHandler(`Time not found with ID: ${id}`);

  await Promise.all([
    Time.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return time;
};
