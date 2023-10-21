const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const newTransactionSchema = new mongoose.Schema({
    date:{
        type:Date,
        required:[true, "Please enter a date"]
    },
    time:{
        type: String,
        required: [true, "Please enter a time"],
        validate: {
        validator: (value) => {
        return /^[0-2][0-9]:[0-5][0-9]:[0-5][0-9]$/.test(value);
      },
      message: "Invalid time format. Please use 'HH:MM:SS'.",
    },
    },
    status:{
        type:String,
        default:"pending",
        enum:{
            values: ["pending","completed","cancel"]
        }
    },
    payment:{
        type:String,
        required:[true, "Payment field required"],
        maxLength:[60, "Payment field must not exceed to 60 characters"]
    },
    customer:{
        type:mongoose.Types.ObjectId,
        required:[true, "Please enter a customer"],
        ref: RESOURCE.USER
    }
});

module.exports = mongoose.model(RESOURCE.TRANSACTION,  newTransactionSchema);