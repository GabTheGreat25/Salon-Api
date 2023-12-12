const Feedback = require("../models/feedback");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { STATUSCODE } = require("../constants/index");

exports.getAllFeedbackData = async () => {
  const feedbacks = await Feedback.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .lean()
    .exec();

  return feedbacks;
};

exports.getSingleFeedbackData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid feedback ID: ${id}`);
  }

  const feedback = await Feedback.findById(id).lean().exec();

  if (!feedback) {
    throw new ErrorHandler(`Feedback not found with ID: ${id}`);
  }

  return feedback;
};

exports.createFeedbackData = async (req, res) => {
  const feedback = await Feedback.create({
    ...req.body,
  });

  return feedback;
};

exports.updateFeedbackData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid feedback ID: ${id}`);

  const existingFeedback = await Feedback.findById(id).lean().exec();

  if (!existingFeedback)
    throw new ErrorHandler(`Feedback not found with ID: ${id}`);

  const updatedFeedback = await Feedback.findByIdAndUpdate(
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

  return updatedFeedback;
};

exports.deleteFeedbackData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid feedback ID ${id}`);
  }

  const feedback = await Feedback.findOne({
    _id: id,
  });

  if (!feedback) throw new ErrorHandler(`Feedback not found with ID: ${id}`);

  await Promise.all([
    Feedback.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return feedback;
};
