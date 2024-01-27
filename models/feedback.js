const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");
const validator = require("validator");

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
  },
  isAnonymous:{
    type: Boolean,
    required:[true, "IsAnonymous field required"],
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.FEEDBACK, feedbackSchema);
