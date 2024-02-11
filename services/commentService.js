const Comment = require("../models/comment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE, RESOURCE } = require("../constants/index");
const { cloudinary } = require("../utils/cloudinary");

exports.getAllCommentData = async () => {
  const comments = await Comment.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.TRANSACTION,
      populate: [
        {
          path: "appointment",
          populate: [
            {
              path: "beautician customer",
              select: "name",
            },
            {
              path: "service",
              select: "service_name type occassion description price image",
              populate: {
                path: "product",
                select: "product_name brand isNew",
              },
            },
          ],
          select: "date time price",
        },
      ],
      select: "status",
    })
    .lean()
    .exec();

  return comments;
};

exports.getSingleCommentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid comment ID: ${id}`);

  const comment = await Comment.findById(id)
    .populate({
      path: RESOURCE.TRANSACTION,
      populate: [
        {
          path: "appointment",
          populate: [
            {
              path: "beautician customer",
              select: "name",
            },
            {
              path: "service",
              select: "service_name type occassion description price image",
              populate: {
                path: "product",
                select: "product_name brand isNew",
              },
            },
          ],
          select: "date time price",
        },
      ],
      select: "status",
    })
    .lean()
    .exec();

  if (!comment) throw new ErrorHandler(`Comment not found with ID: ${id}`);

  return comment;
};

exports.createCommentData = async (req, res) => {
  let images = [];
  if (req.files && Array.isArray(req.files)) {
    images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.secure_url,
          originalname: file.originalname,
        };
      })
    );
  }

  const commentData = {
    ...req.body,
    image: images,
  };

  const comment = await Comment.create(commentData);

  await Comment.populate(comment, {
    path: RESOURCE.TRANSACTION,
    select: "status",
  });

  return comment;
};

exports.updateCommentData = async (req, res, id) => {
  const existingComment = await Comment.findById(id).lean().exec();

  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid comment ID: ${id}`);

  if (!existingComment)
    throw new ErrorHandler(`Comment not found with ID: ${id}`);

  let images = existingComment.image || [];

  try {
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            public_id: file.filename,
          });
          return {
            public_id: result.public_id,
            url: result.secure_url,
            originalname: file.originalname,
          };
        })
      );

      images = [...images, ...newImages];

      if (existingComment.image && existingComment.image.length > 0) {
        await cloudinary.api.delete_resources(
          existingComment.image.map((image) => image.public_id)
        );
      }
    }

    const updatedComment = await Comment.findByIdAndUpdate(
      id,
      {
        ...req.body,
        image: images,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate({
        path: RESOURCE.TRANSACTION,
        select: "status",
      })
      .lean()
      .exec();

    return updatedComment;
  } catch (error) {
    console.error(error);
    throw new ErrorHandler("Internal Server Error");
  }
};

exports.deleteCommentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid comment ID: ${id}`);

  const comment = await Comment.findOne({
    _id: id,
  });

  if (!comment) throw new ErrorHandler(`Comment not found with ID: ${id}`);

  const publicIds = comment.image
    ? comment.image.map((image) => image.public_id)
    : [];

  await Promise.all([
    Comment.deleteOne({
      _id: id,
    })
      .populate({
        path: RESOURCE.TRANSACTION,
        populate: [
          {
            path: "appointment",
            populate: [
              {
                path: "beautician customer",
                select: "name",
              },
              {
                path: "service",
                select: "service_name type occassion description price image",
                populate: {
                  path: "product",
                  select: "product_name brand isNew",
                },
              },
            ],
            select: "date time price",
          },
        ],
        select: "status",
      })
      .lean()
      .exec(),
    publicIds.length > 0 && cloudinary.api.delete_resources(publicIds),
  ]);

  return comment;
};
