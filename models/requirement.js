const mongoose = require("mongoose");
const {
    RESOURCE
} = require("../constants/index");

const requirementSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Types.ObjectId,
        required: [true, "Please enter a employee"],
        ref: RESOURCE.USER
    },
    job: {
        type: String,
        required: [true, "Please pick a job"],
        enum: ["Stylist", "Barber", "Nail technician", "Receptionist"],
    },
    image: [{
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
    }, ],
})

module.exports = mongoose.model(RESOURCE.REQUIREMENT, requirementSchema)