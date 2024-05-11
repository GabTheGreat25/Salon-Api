
const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");
const validator = require("validator");
const badWords = require("bad-words");
const customBadWords = require("../helpers/customBadWords");

const filter = new badWords();
filter.addWords(...customBadWords);

const feedbackSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name Field Required"],
    maxLength: [60, "Name Field must not exceed to 60 characters"],
  },
  email: {
    type: String,
    required: [true, "Feedback Email Field Required"],
    validate: [validator.isEmail, "Please enter valid email address"],
  },
  contact_number: {
    type: String,
    required: [true, "Contact number Field Required"],
    validate: [
      {
        validator: function (value) {
          return /^\d{11}$/.test(value);
        },
        message: "Contact number must be exactly 11 digits.",
      },
      {
        validator: function (value) {
          return /^09\d{9}$/.test(value);
        },
        message: "Invalid Philippine contact number format.",
      },
    ],
  },
  description: {
    type: String,
    required: [true, "Description Field Required"],
    validate: {
      validator: function (value) {
        return !filter.isProfane(value);
      },
      message: "Feedback cannot contain profanity.",
    },
  },
  isAnonymous: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.FEEDBACK, feedbackSchema);