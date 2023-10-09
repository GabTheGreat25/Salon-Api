const Schedule = require("../models/schedule");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

exports.getAllSchedulesData = async () => {
  const schedules = await Schedule.find()
    .sort({ createdAt: -1 })
    .populate({ path: RESOURCE.USER, select: "name" })
    .lean()
    .exec();

  return schedules;
};

exports.getSingleScheduleData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  const schedule = await Schedule.findById(id)
    .populate({ path: RESOURCE.USER, select: "name" })
    .lean()
    .exec();

  if (!schedule) throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  return schedule;
};

exports.CreateScheduleData = async (req, res) => {
  const schedule = await Schedule.create(req.body);

  await Schedule.populate(schedule, { path: RESOURCE.USER, select: "name" });

  return schedule;
};

exports.updateScheduleData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  const updatedSchedule = await Schedule.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({ path: RESOURCE.USER, select: "name" })
    .lean()
    .exec();

  if (!updatedSchedule)
    throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  return updatedSchedule;
};

exports.deleteScheduleData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  if (!id) throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  const schedule = await Schedule.findOneAndDelete({ _id: id })
    .populate({ path: RESOURCE.USER, select: "name" })
    .lean()
    .exec();

  return schedule;
};
