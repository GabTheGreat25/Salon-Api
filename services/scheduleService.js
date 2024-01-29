const Schedule = require("../models/schedule");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE } = require("../constants/index");
const moment = require("moment");

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
  const { isLeave, leaveNote, date, isAvailable, beautician } = req.body;

  let attendance = "absent";

  const existingSchedule = await Schedule.findOne({
    date: date,
    beautician: beautician,
  });
  if (existingSchedule) {
    if (existingSchedule.beautician.toString() === beautician.toString()) {
      throw new ErrorHandler("You have already scheduled this date");
    }
  }

  if (isLeave && leaveNote) {
    const leaveSchedule = await Schedule.findOne({
      date: date,
      beautician: beautician,
      attendance: "leave",
    });
    if (leaveSchedule) {
      throw new ErrorHandler("Leave date has already been scheduled");
    }
    attendance = "leave";
  } else {
    const existingSchedule = await Schedule.findOne({
      date: date,
      beautician: beautician,
    });
    if (existingSchedule) {
      throw new ErrorHandler("Date has already been scheduled");
    }

    attendance =
      isAvailable && Array.isArray(isAvailable)
        ? isAvailable.length === 0
          ? "absent"
          : isAvailable.length >= 5
          ? "present"
          : (() => {
              throw new ErrorHandler("You must have a minimum of 5 pick times");
            })()
        : "absent";
  }

  const schedule = await Schedule.create({
    ...req.body,
    attendance: attendance,
  });

  const today = moment().startOf("day");
  const beauticianSchedules = await Schedule.find({
    beautician: beautician,
    date: {
      $gte: today.toDate(),
      $lt: moment(today).endOf("day").toDate(),
    },
  });

  if (beauticianSchedules.length === 0) {
    await Schedule.updateOne(
      { beautician: beautician, date: today },
      { $set: { attendance: "absent" } },
      { upsert: true }
    );
  }

  const populatedSchedule = await Schedule.findOne({
    _id: schedule._id,
  }).populate("beautician", "name");

  return { schedule: populatedSchedule };
};

exports.updateScheduleData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);
  }

  const { attendance, isLeave, leaveNote, ...updateFields } = req.body;

  let newAttendance = "absent";

  if (isLeave !== undefined) {
    newAttendance = isLeave ? "leave" : "absent";
  } else if (updateFields.isAvailable && updateFields.isAvailable.length >= 5) {
    newAttendance = "present";
  } else if (
    updateFields.isAvailable &&
    updateFields.isAvailable.length === 0
  ) {
    newAttendance = "absent";
  } else throw new ErrorHandler("You must have a minimum of 5 pick times");

  await Schedule.findByIdAndUpdate(
    id,
    {
      $set: {
        ...updateFields,
        attendance: newAttendance,
        isLeave: isLeave !== undefined ? isLeave : newAttendance === "leave",
        leaveNote: isLeave !== undefined ? leaveNote : "",
      },
    },
    {
      new: true,
      runValidators: true,
    }
  );

  const updatedSchedule = await Schedule.findById(id)
    .populate({ path: "beautician", select: "name" })
    .lean()
    .exec();

  if (!updatedSchedule) {
    throw new ErrorHandler(`Schedule not found with ID: ${id}`);
  }

  return { updatedSchedule };
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
  ]);

  return schedule;
};
