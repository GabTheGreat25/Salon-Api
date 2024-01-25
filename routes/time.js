const express = require("express");
const router = express.Router();
const timeController = require("../controllers/timeController");
const { METHOD, PATH, ROLE } = require("../constants/index");
const { authorizeRoles } = require("../middleware/verifyJWT");

const timeRoutes = [
  {
    method: METHOD.GET,
    path: PATH.TIMES,
    roles: [],
    middleware: [],
    handler: timeController.getAllTimes
  },
  {
    method: METHOD.GET,
    path: PATH.TIME_ID,
    roles: [],
    middleware: [],
    handler: timeController.getOneTime
  },
  {
    method: METHOD.POST,
    path: PATH.TIMES,
    roles: [],
    middleware: [],
    handler: timeController.createTime
  },
  {
    method: METHOD.PATCH,
    path: PATH.TIME_EDIT_ID,
    roles: [],
    middleware: [],
    handler: timeController.updateTime
  },
  {
    method: METHOD.DELETE,
    path: PATH.TIME_ID,
    roles: [],
    middleware: [],
    handler: timeController.deleteTime
  }
];

timeRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
