const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const commentsService = require("../services/commentService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");
const { upload } = require("../utils/cloudinary");

exports.getAllComments = asyncHandler(async (req, res, next) => {
  const comments = await commentsService.getAllCommentData();

  return comments?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No comments found"))
    : SuccessHandler(
        res,
        `Comments of ${comments
          .map((comment) => comment?.transaction?.status)
          .join(", ")} and IDs ${comments
          .map((comment) => comment?._id)
          .join(", ")} retrieved`,
        comments
      );
});

exports.getSingleComment = asyncHandler(async (req, res, next) => {
  const comment = await commentsService.getSingleCommentData(req.params.id);

  return !comment
    ? next(new ErrorHandler("No comment found"))
    : SuccessHandler(
        res,
        `Comment of ${comment?.transaction?.status} with ID ${comment?._id} retrieved`,
        comment
      );
});

exports.createNewComment = [
  upload.array("image"),
  checkRequiredFields(["ratings", "description", "image", "transaction"]),
  asyncHandler(async (req, res, next) => {
    const comment = await commentsService.createCommentData(req);

    return SuccessHandler(
      res,
      `New comment of ${comment?.transaction?.status} created with an ID ${comment?._id}`,
      comment
    );
  }),
];

exports.updateComment = [
  upload.array("image"),
  checkRequiredFields(["ratings", "description", "image"]),
  asyncHandler(async (req, res, next) => {
    const comment = await commentsService.updateCommentData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Comment of ${comment?.transaction?.status} with ID ${comment?._id} is updated`,
      comment
    );
  }),
];

exports.deleteComment = asyncHandler(async (req, res, next) => {
  const comment = await commentsService.deleteCommentData(req.params.id);

  return !comment
    ? next(new ErrorHandler("No comment found"))
    : SuccessHandler(
        res,
        `Comment of ${comment?.transaction?.status} with ID ${comment?._id} is deleted`,
        comment
      );
});
