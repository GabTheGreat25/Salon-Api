require("dotenv").config({
  path: "./config/.env",
});
const express = require("express");
const compression = require("compression");
const app = express();
const path = require("path");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const mongoose = require("mongoose");
const { logger, logEvents } = require("./middleware/logger");
const { errorJson, errorHandler } = require("./middleware/errorJson");
const test = require("./routes/test");
const products = require("./routes/product");
const auth = require("./routes/auth");
const users = require("./routes/user");
const services = require("./routes/service");
const schedules = require("./routes/schedule");
const delivery = require("./routes/delivery");
const comments = require("./routes/comment");
const appointments = require("./routes/appointment");
const transactions = require("./routes/transaction");
const feedbacks = require("./routes/feedback");
const brands = require("./routes/brand");
const times = require("./routes/time");
const months = require("./routes/month");
const options = require("./routes/option");
const maya = require("./routes/maya");
const equipments = require("./routes/equipment");
const exclusions = require("./routes/exclusion");
const hiring = require("./routes/hiring");
const reports = require("./routes/report");
const founds = require("./routes/found");
const logbooks = require("./routes/logbook");
const charts = require("./routes/charts");
const inventory = require("./routes/inventory");
const { STATUSCODE } = require("./constants/index");
const connectDB = require("./config/connectDB");
const PORT = process.env.PORT || 4000;

connectDB();

app.use(logger);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/", express.static(path.join(__dirname, "/public")));
app.use("/", require("./routes/root"));

app.use(
  "/api/v1",
  test,
  times,
  feedbacks,
  brands,
  exclusions,
  hiring,
  auth,
  users,
  appointments,
  products,
  schedules,
  services,
  delivery,
  comments,
  transactions,
  months,
  options,
  maya,
  reports,
  equipments,
  founds,
  logbooks,
  equipments,
  inventory,
  charts
);

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
  logEvents(
    `Connected to MongoDB. Click here to view: http://localhost:${PORT}`,
    "mongoLog.log"
  );
});

mongoose.connection.on("error", (err) => {
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoLog.log"
  );
});
