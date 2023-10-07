const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const usersService = require("../services/userService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const token = require("../utils/token");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.login = [
  checkRequiredFields(["email", "password"]),
  asyncHandler(async (req, res, next) => {
    const { user, accessToken, accessTokenMaxAge } =
      await usersService.loginToken(req.body?.email, req.body?.password);

    const setCookie = token.setAccessTokenCookie(accessTokenMaxAge);
    setCookie(res, accessToken);

    SuccessHandler(res, `User ${user?.name} successfully login`, {
      user,
      accessToken,
    });
  }),
];

exports.logout = asyncHandler(async (req, res, next) => {
  const cookies = await usersService.logoutUser(req.cookies, res);

  SuccessHandler(res, "Logout successfully", cookies);
});

exports.getAllUsers = asyncHandler(async (req, res, next) => {
  const users = await usersService.getAllUsersData();

  return users?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No users found"))
    : SuccessHandler(
        res,
        `Users with user ${users.map((u) => u?.user).join(", ")} and IDs ${users
          .map((u) => u?._id)
          .join(", ")} retrieved`,
        users
      );
});

exports.getSingleUser = asyncHandler(async (req, res, next) => {
  const user = await usersService.getSingleUserData(req.params.id);

  return !user
    ? next(new ErrorHandler("No user found"))
    : SuccessHandler(
        res,
        `User ${user?.name} with ID ${user?._id} retrieved`,
        user
      );
});

exports.createNewUser = [
  upload.array("image"),
  checkRequiredFields(["name", "email", "password", "image"]),
  asyncHandler(async (req, res, next) => {
    const user = await usersService.CreateUserData(req);

    return SuccessHandler(
      res,
      `New user ${user?.name} created with an ID ${user?._id}`,
      user
    );
  }),
];

exports.updateUser = [
  upload.array("image"),
  checkRequiredFields(["name", "email", "image"]),
  asyncHandler(async (req, res, next) => {
    const user = await usersService.updateUserData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `User ${user?.name} with ID ${user?._id} is updated`,
      user
    );
  }),
];

exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await usersService.deleteUserData(req.params.id);

  return !user
    ? next(new ErrorHandler("No user found"))
    : SuccessHandler(
        res,
        `User ${user?.name} with ID ${user?._id} is deleted`,
        user
      );
});
