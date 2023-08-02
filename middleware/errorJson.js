const ErrorHandler = require("../utils/errorHandler");
const { STATUSCODE, ERROR } = require("../constants/index");

const errorJson = (err, req, res, next) => {
  if (err instanceof ErrorHandler) return next(err);

  const error = new ErrorHandler(err.message);

  next(error);
};

const { logEvents } = require("./logger");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUSCODE.SERVER_ERROR;
  const message = err.message || ERROR.INTERNAL_SERVER_ERROR;

  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
    },
  });
};

module.exports = { errorJson, errorHandler };
