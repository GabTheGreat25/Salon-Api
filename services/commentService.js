const Comment = require("../models/comment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const {
  STATUSCODE,
  RESOURCE
} = require("../constants/index");
const {
  cloudinary
} = require("../utils/cloudinary");

exports.getAllCommentData = async () => {
  const comments = await Comment.find().sort({
      createdAt: STATUSCODE.NEGATIVE_ONE
    }).populate({
      path: RESOURCE.TRANSACTION,
      select: "status"
    })
    .populate({
      path: RESOURCE.TRANSACTION,
      populate: {
        path: "customer",
        select: "name"
      }
    }).lean().exec();

  return comments;
};

exports.getSingleCommentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid comment ID: ${id}`);

  const comment = await Comment.findById(id)
    .populate({
      path: RESOURCE.TRANSACTION,
      select: "status"
    })
    .populate({
      path: RESOURCE.TRANSACTION,
      populate: {
        path: "customer",
        select: "name"
      }
    })
    .lean()
    .exec();

  if (!comment) throw new ErrorHandler(`Comment not found with ID: ${id}`);

  return comment;
};

exports.CreateCommentData = async (req, res) => {
  let images = [];
  if (req.files && Array.isArray(req.files)) {
    images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      })
    );
  }

  if (images.length === 0) throw new ErrorHandler("At least one image is required");

  const commentData = {
    ...req.body,
    image: images,
  };

  const comment = await Comment.create(commentData);

  await Comment.populate(comment, {
    path: RESOURCE.TRANSACTION,
    select: "status",
    populate: {
      path: "customer",
      select: "name"
    }
  });

  return comment;
};

exports.updateCommentData = async (req, res, id) => {
  const existingComment = await Comment.findById(id).lean().exec();

  let images = existingComment.image || [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      })
    );

    await cloudinary.api.delete_resources(
      existingComment.image.map((image) => image.public_id)
    );
  }

  const updatedComment = await Comment.findByIdAndUpdate(id, {
      ...req.body,
      image: images,
    }, {
      new: true,
      runValidators: true,
    })
    .populate({
      path: RESOURCE.TRANSACTION,
      select: "status"
    })
    .populate({
      path: RESOURCE.TRANSACTION,
      populate: {
        path: "customer",
        select: "name"
      }
    })
    .lean()
    .exec();

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid comment ID: ${id}`);

  if (!updatedComment)
    throw new ErrorHandler(`Comment not found with ID: ${id}`);

  return updatedComment;
};

exports.deleteCommentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid comment ID: ${id}`);

  const comment = await Comment.findOne({
    _id: id
  });

  if (!comment) throw new ErrorHandler(`Comment not found with ID: ${id}`);

  const publicIds = comment.image.map((image) => image.public_id);

  await Promise.all([
    Comment.deleteOne({
      _id: id
    }).populate({
      path: RESOURCE.TRANSACTION,
      select: "status"
    })
    .populate({
      path: RESOURCE.TRANSACTION,
      populate: {
        path: "customer",
        select: "name"
      }
    }).lean().exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return comment;
};