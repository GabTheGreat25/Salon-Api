const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const Comment = require("../models/comment");

exports.getAllCommentData = async()=>{
    const comments = await Comment.find().sort({ createdAt: -1}).lean().exec();

    return comments;
};

exports.getSingleCommentData = async(id)=>{
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ErrorHandler(`Invalid comment ID ${id}`);
    }

    const comment = await Comment.findById(id).lean().exec();

    if(!comment){
        throw new ErrorHandler(`Comment not found with ID ${id}`);
    }

    return comment;
};

exports.createCommentData = async (req, res) => {
    const comment = await Comment.create(req.body);

    return comment;
  };

exports.updateCommentData = async(req, res, id)=>{
  if (!mongoose.Types.ObjectId.isValid(id))
  throw new ErrorHandler(`Invalid comment ID: ${id}`);

const existingComment = await Comment.findById(id).lean().exec();

if (!existingComment)
  throw new ErrorHandler(`Comment not found with ID: ${id}`);

const updatedComment = await Comment.findByIdAndUpdate(
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

if (!updatedComment)
  throw new ErrorHandler(`Comment not found with ID: ${id}`);

return updatedComment;
}

exports.deleteCommentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid comment ID ${id}`);
  }

  const comment = await Comment.findOne({ _id: id });
  if (!comment) throw new ErrorHandler(`Comment not found with ID: ${id}`);

  const commentData = await Comment.findOneAndDelete({ _id: id }).lean().exec();

  return commentData;
};
