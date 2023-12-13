const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const verificationSchema = new mongoose.Schema({
  transaction: {
    type: mongoose.Types.ObjectId,
    required: [true, "Please enter a transaction"],
    ref: RESOURCE.TRANSACTION,
  },
  confirm: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model(RESOURCE.VERIFICATION, verificationSchema);
