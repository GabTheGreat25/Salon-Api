const { STATUSCODE } = require("../constants/index");

const SuccessHandler = (res, message, details) => {
  res.status(STATUSCODE.SUCCESS).json({
    success: true,
    message: message,
    details: details,
  });
};

module.exports = SuccessHandler;
