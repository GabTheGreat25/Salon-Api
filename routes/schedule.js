const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

const scheduleRoutes = [
  {
    method: METHOD.GET,
    path: PATH.SCHEDULES,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
    middleware: [verifyJWT],
    handler: scheduleController.getAllSchedules,
  },
  {
    method: METHOD.POST,
    path: PATH.SCHEDULES,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
    middleware: [verifyJWT],
    handler: scheduleController.createNewSchedule,
  },
  {
    method: METHOD.GET,
    path: PATH.SCHEDULE_ID,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
    middleware: [verifyJWT],
    handler: scheduleController.getSingleSchedule,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_SCHEDULE_ID,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
    middleware: [verifyJWT],
    handler: scheduleController.updateSchedule,
  },
  {
    method: METHOD.DELETE,
    path: PATH.SCHEDULE_ID,
    roles: [ROLE.ADMIN],
    middleware: [verifyJWT],
    handler: scheduleController.deleteSchedule,
  },
];

scheduleRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
