const mongoose = require("mongoose");
const validator = require("validator");
const { RESOURCE } = require("../constants/index");

const phoneNumberRegex = /^\d{11}$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [30, "Your name cannot exceed 30 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: true,
    validate: [validator.isEmail, "Please enter valid email address"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [6, "Your password must be longer than 6 characters"],
    select: false,
  },
  contact_number: {
    type: String,
    required: [true, "Contact number Field Required"],
    unique: true,
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
  roles: [
    {
      type: String,
      enum: ["Admin", "Employee", "Online Customer", "Walk-in Customer"],
      default: "Online Customer",
    },
  ],
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
  resetTokenUsed: {
    type: Boolean,
    default: false,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.USER, userSchema);
