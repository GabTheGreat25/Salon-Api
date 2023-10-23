const mongoose = require("mongoose");
const {
    RESOURCE
} = require("../constants/index");

const appointmentSchema = new mongoose.Schema({
    service: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a service"],
        ref: RESOURCE.SERVICE
    },
    employee: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a user"],
        ref: RESOURCE.USER,
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
    total_price: {
        type:Number,
        required:[true, "Please enter a total price"],
        min:0
    },
    note: {
        type: String,
        required: [true, "Please enter a note"],
    },
});

module.exports = mongoose.model(RESOURCE.APPOINTMENT, appointmentSchema);