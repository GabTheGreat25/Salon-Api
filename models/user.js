const mongoose = require("mongoose");
const validator = require("validator");
const { RESOURCE, STATUSCODE } = require("../constants/index");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
    maxLength: [STATUSCODE.TWENTY, "Your name cannot exceed 20 characters"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email"],
    unique: [true, "Email is already use by another user."],
    validate: [validator.isEmail, "Please enter valid email address"],
  },
  age: {
    type: Number,
    required: [true, "Please enter your age"],
    min: [STATUSCODE.THIRTEEN, "You must be at least 13 years old"],
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minlength: [
      STATUSCODE.SIX,
      "Your password must be longer than 6 characters",
    ],
    select: false,
  },
  contact_number: {
    type: String,
    required: [true, "Contact number Field Required"],
    // unique: [true, "Contact number is already use by another user."],
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
      enum: ["Admin", "Beautician", "Customer", "Receptionist"],
      default: "Customer",
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
  verificationCode: {
    code: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: null,
    },
  },
  active: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.USER, userSchema);
