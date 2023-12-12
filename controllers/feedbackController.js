const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const feedbacksService = require("../services/feedbackService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllFeedbacks = asyncHandler(async (req, res, next) => {
  const feedbacks = await feedbacksService.getAllFeedbackData();

  return feedbacks?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No feedbacks found"))
    : SuccessHandler(
        res,
        `Feedbacks of ${feedbacks
          .map((feedback) => feedback?.name)
          .join(", ")} and IDs ${feedbacks
          .map((feedback) => feedback?._id)
          .join(", ")} retrieved`,
        feedbacks
      );
});

exports.getSingleFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await feedbacksService.getSingleFeedbackData(req.params?.id);

  return !feedback
    ? next(new ErrorHandler("No feedback found"))
    : SuccessHandler(
        res,
        `Feedback of ${feedback?.name} with ID ${feedback?._id} retrieved`,
        feedback
      );
});

exports.createNewFeedback = [
  checkRequiredFields(["name", "email", "contact_number", "description"]),
  asyncHandler(async (req, res, next) => {
    const feedback = await feedbacksService.createFeedbackData(req);

    return SuccessHandler(
      res,
      `Created new Feedback by ${feedback?.name} with an ID ${feedback?._id}`,
      feedback
    );
  }),
];

exports.updateFeedback = [
  checkRequiredFields(["name", "email", "contact_number", "description"]),
  asyncHandler(async (req, res, next) => {
    const feedback = await feedbacksService.updateFeedbackData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Feedback of ${feedback?.name} with ID ${feedback?._id} is updated`,
      feedback
    );
  }),
];

exports.deleteFeedback = asyncHandler(async (req, res, next) => {
  const feedback = await feedbacksService.deleteFeedbackData(req.params.id);

  return !feedback
    ? next(new ErrorHandler("No feedback found"))
    : SuccessHandler(
        res,
        `Feedback ${feedback?.feedback} with ID ${feedback?._id} is deleted`,
        feedback
      );
});
