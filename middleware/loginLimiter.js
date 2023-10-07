const rateLimit = require("express-rate-limit");
const { logEvents } = require("./logger");
const { ERROR } = require("../constants/index");

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;
const MESSAGE = {
  message: ERROR.TOO_MANY_ATTEMPTS,
};
const HANDLER = (req, res, next, { message, statusCode }) => {
  logEvents(
    `Too Many Requests: ${message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );
  res.status(statusCode).send(message);
};

module.exports = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: MESSAGE,
  handler: HANDLER,
  standardHeaders: true,
  legacyHeaders: false,
});
