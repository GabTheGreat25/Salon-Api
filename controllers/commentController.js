const commentService = require("../services/commentService");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllComment = asyncHandler(async(req, res, next)=>{
    const comments = await commentService.getAllCommentData();

    return comments?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No Comments Found"))
    : SuccessHandler(
        res,
        `Comments with description ${comments
        .map((c)=> c?.description)
        .join(", ")} and ID's ${comments
        .map((c)=> c?._id)
        .join(", ")}`,
        comments
    );
});

exports.getSingleComment = asyncHandler(async(req, res, next)=>{
    const comment = await commentService.getSingleCommentData(req.params?.id);

    return !comment
    ? next(new ErrorHandler("No comment found"))
    : SuccessHandler(
        res,
        `comment with ${comment.description} and ID ${comment?._id} retrieved`,
        comment
        );
});

exports.createNewComment = [
    checkRequiredFields(["description","suggestion","transaction"]),
    asyncHandler(async(req, res, next)=>{
        const comment = await commentService.createCommentData(req);

        return SuccessHandler(
            res,
            `Created comment with description ${comment.description} and ID ${comment?._id}`,
            comment
        );
    }),
];

exports.updateComment = [
    checkRequiredFields(["description","suggestion","transaction"]),
    asyncHandler(async(req, res, next)=>{
        const comment = await commentService.updateCommentData(
            req,
            res,
            req.params.id
        );

        return SuccessHandler(
            res,
            `Comment with description${comment.description} and ID ${comment?._id} is updated`,
            comment
        )
    }),
];

exports.deleteComment = asyncHandler(async(req, res, next)=>{
    const comment = await commentService.deleteCommentData(req.params.id);

    return !comment
    ? next(new ErrorHandler("No Comment Found"))
    : SuccessHandler(
        res,
        `Comment with description${comment.description} and ID ${comment?._id} is deleted`,
        comment
    );
});