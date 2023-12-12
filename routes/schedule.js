const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const scheduleRoutes = [
  {
    method: METHOD.GET,
    path: PATH.SCHEDULES,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: scheduleController.getAllSchedules,
  },
  {
    method: METHOD.POST,
    path: PATH.SCHEDULES,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: scheduleController.createNewSchedule,
  },
  {
    method: METHOD.GET,
    path: PATH.SCHEDULE_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: scheduleController.getSingleSchedule,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_SCHEDULE_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: scheduleController.updateSchedule,
  },
  {
    method: METHOD.DELETE,
    path: PATH.SCHEDULE_ID,
    roles: [ROLE.ADMIN],
    handler: scheduleController.deleteSchedule,
  },
];

scheduleRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
