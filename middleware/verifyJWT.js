const { verifyAccessToken } = require("../utils/token");
const ErrorHandler = require("../utils/errorHandler");
const { getBlacklistedTokens } = require("../services/userService");
const { STATUSCODE } = require("../constants/index");

exports.verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.match(/^Bearer\s+(.*)$/))
      throw new ErrorHandler("Please Log In First");

    const token = authHeader?.match(/^Bearer\s+(.*)$/)[1];

    if (getBlacklistedTokens().includes(token))
      throw new ErrorHandler("Token Already Expired");

    const decoded = verifyAccessToken(token);
    req.user = decoded?.UserInfo?.email;
    req.roles = decoded?.UserInfo?.roles;

    next();
  } catch (error) {
    next(error);
  }
};

exports.authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) =>
    allowedRoles.length === STATUSCODE.ZERO || !req.roles
      ? next()
      : req.roles.some((role) => allowedRoles.includes(role))
      ? next()
      : next(
          new ErrorHandler(
            `Roles ${req.roles.join(
              ","
            )} are not allowed to access this resource`
          )
        );
