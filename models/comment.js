const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");
const badWords = require("bad-words");
const customBadWords = require("../helpers/customBadWords");

const filter = new badWords();
filter.addWords(...customBadWords);

const commentSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: RESOURCE.TRANSACTION,
  },
  ratings: {
    type: Number,
    required: [true, "Please enter a rating"],
    min: 1,
    max: 5,
    validate: {
      validator: Number.isInteger,
      message: "Ratings must be a whole number between 1 and 5",
    },
  },
  description: {
    type: String,
    required: [true, "Please enter a description"],
    validate: {
      validator: function (value) {
        return !filter.isProfane(value);
      },
      message: "Comments cannot contain profanity.",
    },
  },
  suggestion: {
    type: String,
    required: false,
    validate: {
      validator: function (value) {
        return !filter.isProfane(value);
      },
      message: "Comments cannot contain profanity.",
    },
  },
  isAnonymous:{
    type: Boolean,
    default:false
  },
  image: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      originalname: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model(RESOURCE.COMMENT, commentSchema);
