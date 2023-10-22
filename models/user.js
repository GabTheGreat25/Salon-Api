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
    required: [true, "Please enter your contact number"],
    validate: {
      validator: function(value) {
        return phoneNumberRegex.test(value);
      },
      message: "Please enter a valid 11-digit phone number"
    }
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
});

module.exports = mongoose.model(RESOURCE.USER, userSchema);
