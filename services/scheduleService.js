const Schedule = require("../models/schedule");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE } = require("../constants/index");
const moment = require("moment");
const { sendSMS } = require("../utils/twilio");

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

exports.confirmLeaveNote = async (scheduleId) => {
  const schedule = await Schedule.findById(scheduleId).populate(
    "beautician",
    "name contact_number"
  );

  if (!schedule)
    throw new ErrorHandler(`Schedule not found with ID: ${scheduleId}`);

  if (schedule.leaveNoteConfirmed)
    throw new ErrorHandler(`Leave note already confirmed`);

  schedule.leaveNoteConfirmed = true;

  await schedule.save();

  const smsMessage = `Dear ${schedule.beautician.name}, Leave for schedule confirmed. Enjoy your time off!`;

  console.log(smsMessage);

  await sendSMS(
    `+63${schedule.beautician.contact_number.substring(1)}`,
    smsMessage
  );

  return schedule;
};

exports.createScheduleData = async (req, res) => {
  const { isLeave, leaveNote, date, beautician, status } = req.body;

  const existingSchedule = await Schedule.findOne({
    beautician: beautician,
    date: date,
  });

  if (existingSchedule)
    throw new ErrorHandler("Date has already been scheduled with leave");

  const schedule = await Schedule.create({
    beautician: beautician,
    date: date,
    status: status,
    isLeave: isLeave,
    leaveNote: leaveNote,
    leaveNoteConfirmed: false,
  });

  const populatedSchedule = await Schedule.findById(schedule._id).populate(
    "beautician",
    "name contact_number"
  );

  const smsMessage = `Dear ${populatedSchedule.beautician.name}, Leave schedule created. Please wait for the admin to confirm.`;
  console.log(smsMessage);
  await sendSMS(
    `+63${populatedSchedule.beautician.contact_number.substring(1)}`,
    smsMessage
  );

  setTimeout(async () => {
    const updatedSchedule = await Schedule.findById(schedule._id).populate(
      "beautician",
      "name contact_number"
    );

    if (updatedSchedule && !updatedSchedule.leaveNoteConfirmed) {
      const denialMessage = `Dear ${updatedSchedule.beautician.name}, your leave request has been denied. Sorry, you can't have a leave.`;
      console.log(denialMessage);
      await sendSMS(
        `+63${updatedSchedule.beautician.contact_number.substring(1)}`,
        denialMessage
      );

      await Schedule.findByIdAndDelete(schedule._id);
    }
  }, 2 * 24 * 60 * 60 * 1000);
  // }, 60 * 1000);

  return { schedule: populatedSchedule };
};

exports.updateScheduleData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);
  }

  const { date, beautician } = req.body;

  const existingSchedule = await Schedule.findOne({
    beautician: beautician,
    date: date,
    _id: { $ne: id },
  });

  if (existingSchedule)
    throw new ErrorHandler(
      "Beautician already has a leave schedule on the selected date"
    );

  await Schedule.findByIdAndUpdate(
    id,
    {
      $set: {
        beautician: beautician,
        date: date,
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

  if (!updatedSchedule)
    throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  return { updatedSchedule };
};

exports.updateScheduleAdminData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);
  }

  const { isLeave, leaveNote, date, beautician, status, leaveNoteConfirmed } =
    req.body;

  const existingSchedule = await Schedule.findOne({
    beautician: beautician,
    date: date,
    _id: { $ne: id },
  });

  if (existingSchedule)
    throw new ErrorHandler(
      "Beautician already has a leave schedule on the selected date"
    );

  await Schedule.findByIdAndUpdate(
    id,
    {
      $set: {
        date: date,
        leaveNote: leaveNote,
        status: status,
        isLeave: isLeave,
        leaveNote: leaveNote,
        leaveNoteConfirmed: leaveNoteConfirmed,
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

  if (!updatedSchedule)
    throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  return { updatedSchedule };
};

exports.deleteConfirmData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid schedule ID: ${id}`);

  const schedule = await Schedule.findById(id).populate(
    "beautician",
    "name contact_number"
  );

  if (!schedule) throw new ErrorHandler(`Schedule not found with ID: ${id}`);

  if (!schedule.leaveNoteConfirmed) {
    const smsMessage = `Dear ${schedule.beautician.name}, your leave request has been denied. Sorry, you can't have a leave.`;
    console.log(smsMessage);
    await sendSMS(
      `+63${schedule.beautician.contact_number.substring(1)}`,
      smsMessage
    );
  }

  await Schedule.deleteOne({
    _id: id,
  });

  return schedule;
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
