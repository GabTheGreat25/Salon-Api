const mongoose = require("mongoose");
const { RESOURCE } = require("../constants/index");

const newCommentSchema = new mongoose.Schema({
    description:{
        type:String,
        required:[true, "Description field required"],
    },
    suggestion:{
        type:String,
        required:[true, "Suggestion field required"],
    },
    transaction:{
        type:mongoose.Types.ObjectId,
        required:[true, "Please enter a transaction"],
        ref:RESOURCE.TRANSACTION
    }

});

module.exports = mongoose.model(RESOURCE.COMMENT, newCommentSchema)