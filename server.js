require("dotenv").config({ path: "./config/.env" });
const express = require("express");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const mongoose = require("mongoose");
const { logger, logEvents } = require("./middleware/logger");
const { errorJson, errorHandler } = require("./middleware/errorJson");
const test = require("./routes/test");
const { STATUSCODE } = require("./constants/index");
const connectDB = require('./config/connectDB')
const PORT = process.env.PORT || 4000;

connectDB();
app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "/public")));
app.use("/", require("./routes/root"));

app.use("/api/v1", test);

app.all("*", (req, res) => {
  const filePath = req.accepts("html")
    ? path.join(__dirname, "views", "404.html")
    : req.accepts("json")
    ? { message: "404 Not Found" }
    : "404 Not Found";

  res.status(STATUSCODE.NOT_FOUND).sendFile(filePath);
});

app.use(errorJson);
app.use(errorHandler);

mongoose.connection.once("open", () => {
  app.listen(PORT);
  console.log(`Connected to MongoDB on ${mongoose.connection.host}:${PORT}`);
});

mongoose.connection.on("error", (err) => {
  console.log(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
