const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const foundSchema = new mongoose.Schema({
    equipment: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Please enter equipment"],
        ref: RESOURCE.EQUIPMENT,
    },
    report: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Please enter report"],
        ref: RESOURCE.REPORT,
    },
    date_found: {
        type: Date,
        required: false,
      },
    date_missing: {
        type: Date,
        required: [true, "Please enter date missing"],
    },
    quantity_found: {
        type: Number,
        required: [true, "Please enter quantity found"],
    }
});

module.exports = mongoose.model(RESOURCE.FOUND, foundSchema)