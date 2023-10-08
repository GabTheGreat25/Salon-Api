const mongoose = require("mongoose");
const { STATUSCODE } = require("../constants/index");

const connectDB = async () => {
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.DATABASE_URI);
  } catch (err) {
    const mongoExit = STATUSCODE.ONE;
    process.exit(mongoExit);
  }
};

module.exports = connectDB;
