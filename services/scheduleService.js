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

  // await sendSMS(
  //   `+63${schedule.beautician.contact_number.substring(1)}`,
  //   smsMessage
  // );

  return schedule;
};

exports.createScheduleData = async (req, res) => {
  const { isLeave, leaveNote, date, beautician, isAvailable } = req.body;

  let attendance = "absent";
  let schedule;

  const existingSchedule = await Schedule.findOne({ date: date });
  if (existingSchedule)
    throw new ErrorHandler("Date has already been scheduled");
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

  if (isLeave && leaveNote) {
    schedule = await Schedule.create({
      ...req.body,
      attendance: "leave",
    });

    const populatedSchedule = await Schedule.findById(schedule._id).populate(
      "beautician",
      "name contact_number"
    );

    const smsMessage = `Dear ${populatedSchedule.beautician.name}, Leave schedule created. Please wait for the admin to confirm.`;
    console.log(smsMessage);
    // await sendSMS(
    //   `+63${populatedSchedule.beautician.contact_number.substring(1)}`,
    //   smsMessage
    // );

    setTimeout(async () => {
      const updatedSchedule = await Schedule.findById(schedule._id).populate(
        "beautician",
        "name contact_number"
      );

      if (updatedSchedule && !updatedSchedule.leaveNoteConfirmed) {
        const smsMessage = `Dear ${updatedSchedule.beautician.name}, your leave request has been denied. Sorry, you can't have a leave.`;
        console.log(smsMessage);
        // await sendSMS(
        //   `+63${updatedSchedule.beautician.contact_number.substring(1)}`,
        //   smsMessage
        // );

        await Schedule.findByIdAndDelete(schedule._id);
      }
    }, 2 * 24 * 60 * 60 * 1000);
    // }, 60 * 1000);
  } else {
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

    schedule = await Schedule.create({
      ...req.body,
      attendance: attendance,
    });
  }

  const populatedSchedule = await Schedule.findOne({
    _id: schedule._id,
  }).populate("beautician", "name contact_number");

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
    // await sendSMS(
    //   `+63${schedule.beautician.contact_number.substring(1)}`,
    //   smsMessage
    // );
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
