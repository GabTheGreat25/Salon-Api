const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

const userRoutes = [
  {
    method: METHOD.GET,
    path: PATH.USERS,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    middleware: [verifyJWT],
    handler: userController.getAllUsers,
  },
  {
    method: METHOD.POST,
    path: PATH.USERS,
    roles: [ROLE.ADMIN],
    middleware: [],
    handler: userController.createNewUser,
  },
  {
    method: METHOD.GET,
    path: PATH.USER_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    middleware: [verifyJWT],
    handler: userController.getSingleUser,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_USER_ID,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    middleware: [verifyJWT],
    handler: userController.updateUser,
  },
  {
    method: METHOD.DELETE,
    path: PATH.USER_ID,
    roles: [ROLE.ADMIN],
    middleware: [verifyJWT],
    handler: userController.deleteUser,
  },
  {
    method: METHOD.PATCH,
    path: PATH.ACTIVATE_USER_ID,
    roles: [ROLE.ADMIN],
    middleware: [verifyJWT],
    handler: userController.confirmUser,
  },
  {
    method: METHOD.PATCH,
    path: PATH.UPDATE_PASSWORD,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    middleware: [verifyJWT],
    handler: userController.updatePassword,
  },
];

userRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
