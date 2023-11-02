const mongoose = require("mongoose");
const {
    RESOURCE
} = require("../constants/index");

const statusSchema = new mongoose.Schema({
    schedule: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a schedule"],
        ref: RESOURCE.SCHEDULE
    },
    attendance: {
        type: String,
        enum: ["present", "absent"],
    },
})

module.exports = mongoose.model(RESOURCE.STATUS, statusSchema)