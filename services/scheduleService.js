const Schedule = require("../models/schedule");
const Status = require("../models/status");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE } = require("../constants/index");

exports.getAllSchedulesData = async () => {
  const schedules = await Schedule.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({ path: "beautician", select: "name" })
    .lean()
    .exec();

  return schedules;
};

exports.getSingleScheduleData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  const schedule = await Schedule.findById(id)
    .populate({ path: "beautician", select: "name" })
    .lean()
    .exec();

  if (!schedule) throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  return schedule;
};

exports.createScheduleData = async (req, res) => {
  const schedule = await Schedule.create(req.body);

  await Schedule.populate(schedule, { path: "beautician", select: "name" });

  const attendance = schedule.isLeave
    ? "leave"
    : schedule.available
    ? "present"
    : "absent";

  const createStatus = await Status.create({
    schedule: schedule?._id,
    attendance: attendance,
  });

  return { schedule, createStatus };
};

exports.updateScheduleData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  const updatedSchedule = await Schedule.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .populate({ path: "beautician", select: "name" })
    .lean()
    .exec();

  if (!updatedSchedule)
    throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  const attendance = updatedSchedule.isLeave
    ? "leave"
    : updatedSchedule.available
    ? "present"
    : "absent";

  const updateStatus = await Status.findOneAndUpdate(
    { schedule: id },
    { attendance: attendance },
    {
      new: true,
      runValidators: true,
    }
  );

  return { updatedSchedule, updateStatus };
};

exports.deleteScheduleData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  const schedule = await Schedule.findOne({
    _id: id,
  });

  if (!schedule) throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  await Promise.all([
    Schedule.deleteOne({
      _id: id,
    })
      .populate({ path: "beautician", select: "name" })
      .lean()
      .exec(),
    Status.deleteMany({ schedule: id }).lean().exec(),
  ]);

  return schedule;
};
