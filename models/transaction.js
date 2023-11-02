const mongoose = require("mongoose");
const {
    RESOURCE
} = require("../constants/index");

const transactionSchema = new mongoose.Schema({
    appointment: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a appointment"],
        ref: RESOURCE.APPOINTMENT,
    },
    customer: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a user"],
        ref: RESOURCE.USER,
    },
    date: {
        type: Date,
        required: [true, "Please enter a date"]
    },
    time: {
        type: String,
        required: [true, "Please enter a time"],
        validate: {
            validator: (value) => {
                return /^[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(value);
            },
            message: "Invalid time format. Please use 'HH:MM:SS'.",
        },
    },
    status: {
        type: String,
        default: "pending",
        enum: {
            values: ["pending", "completed", "cancelled"]
        }
    },
    payment: {
        type: String,
        required: [true, "Payment field required"],
    },
});

module.exports = mongoose.model(RESOURCE.TRANSACTION, transactionSchema);