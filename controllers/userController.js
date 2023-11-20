const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const usersService = require("../services/userService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const token = require("../utils/token");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");
const { ROLE } = require("../constants/index");

exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const updatedUser = await usersService.updatePassword(
    req.params.id,
    oldPassword,
    newPassword,
    confirmPassword
  );
  SuccessHandler(
    res,
    `Old Password ${oldPassword} Successfully Updated with ${newPassword}`,
    updatedUser
  );
});

exports.confirmUser = asyncHandler(async (req, res, next) => {
  const userId = req.params.id;

  await usersService.confirmUserRole(userId);

  SuccessHandler(res, `User with ID ${userId} has been activated by the admin.`, userId);
});

exports.login = [
  checkRequiredFields(["email", "password"]),
  asyncHandler(async (req, res, next) => {
    const { user, accessToken, accessTokenMaxAge } =
      await usersService.loginToken(req.body?.email, req.body?.password);

    const userData = {
      user,
      accessToken,
      ...(user.requirement && { requirement: user.requirement }),
      ...(user.information && { information: user.information }),
    };

    const setCookie = token.setAccessTokenCookie(accessTokenMaxAge);
    setCookie(res, accessToken);

    SuccessHandler(res, `User ${user?.name} successfully login`, userData);
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
        `Users with user ${users.map((u) => u?.name).join(", ")} and IDs ${users
          .map((u) => u?._id)
          .join(", ")} retrieved`,
        users
      );
});

exports.getSingleUser = asyncHandler(async (req, res, next) => {
  const userRoles = req.userRoles;

    const user = await usersService.getSingleUserData(req.params?.id, userRoles);

    if (!user) {
      return next(new ErrorHandler("No user found"));
    }

    return SuccessHandler(
      res,
      `User ${user?.name} with ID ${user?._id} retrieved`,
      user
    );
});

exports.createNewUser = [
  upload.array("image"),
  checkRequiredFields(["name", "email", "password", "contact_number", "image"]),
  asyncHandler(async (req, res, next) => {
    const { user, newRequirement, newInformation } = await usersService.createUserData(req);

    const successMessage =
      user && user.roles.includes(ROLE.ONLINE_CUSTOMER)
        ? `New customer ${user?.name} created with an ID ${user?._id}`
        : user && user.roles.includes(ROLE.ADMIN)
        ? `New admin ${user?.name} created with an ID ${user?._id}`
        : user && user.roles.includes(ROLE.EMPLOYEE)
        ? `New employee ${user?.name} created with an ID ${user?._id}. Please wait for the admin to confirm your account. Thank you!`
        : null;

    return SuccessHandler(
      res,
      successMessage,
      { user, newRequirement, newInformation }
    );
  }),
];

exports.updateUser = [
  upload.array("image"),
  checkRequiredFields(["name", "email", "contact_number", "image"]),
  asyncHandler(async (req, res, next) => {
    const { updatedUser, updateRequirement, updateInformation } = await usersService.updateUserData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `User ${updatedUser?.name} with ID ${updatedUser?._id} is updated`,
      { updatedUser, updateRequirement, updateInformation }
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
