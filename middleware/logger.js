const { format } = require("date-fns");
const { v4: uuid } = require("uuid");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

const LOG_DIR = path.join(__dirname, "..", "logs");
const MAX_MESSAGES_PER_LOG_FILE = 100000;
const MAX_DUPLICATE_ERRORS = 10;
const LOG_RETENTION_PERIOD = 24 * 24 * 60 * 60 * 1000;
const ERROR_DUPLICATION_THRESHOLD = 10000;

let lastErrorMessage = "";
let lastErrorTime = null;
let errorCount = 0;

const logEvents = async (message, logFileName) => {
  const dateTime = format(new Date(), "yyyyMMdd\tHH:mm:ss");
  const logItem = `${dateTime}\t${uuid()}\t${message}\n`;

  if (!fs.existsSync(LOG_DIR)) await fsPromises.mkdir(LOG_DIR);

  const logFilePath = path.join(LOG_DIR, logFileName);

  let messagesCount = 0;

  if (fs.existsSync(logFilePath)) {
    const logContent = await fsPromises.readFile(logFilePath, "utf-8");
    messagesCount = logContent.split("\n").filter((line) => line !== "").length;
  }

  if (messagesCount >= MAX_MESSAGES_PER_LOG_FILE)
    await fsPromises.unlink(logFilePath);

  if (
    message === lastErrorMessage &&
    lastErrorTime &&
    Date.now() - lastErrorTime < ERROR_DUPLICATION_THRESHOLD
  ) {
    if (++errorCount > MAX_DUPLICATE_ERRORS) {
      console.warn(
        `Discarded error message '${message}' due to duplicate errors.`
      );
      return;
    }
  } else lastErrorMessage = message;
  errorCount = 0;

  lastErrorTime = Date.now();

  await fsPromises.appendFile(logFilePath, logItem);
};

const logger = (req, res, next) => {
  logEvents(`${req.method}\t${req.url}\t${req.headers.origin}`, "reqLog.log");

  next();
};

const deleteAllLogs = async () => {
  if (!fs.existsSync(LOG_DIR)) return;
  const files = await fsPromises.readdir(LOG_DIR);
  const deletionPromises = files.map((file) =>
    fsPromises.unlink(path.join(LOG_DIR, file))
  );
  await Promise.all(deletionPromises);
};

setInterval(deleteAllLogs, LOG_RETENTION_PERIOD);

module.exports = { logEvents, logger };
