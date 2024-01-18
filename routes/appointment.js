const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const appointmentRoutes = [
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENTS,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: appointmentController.getAllAppointments,
  },
  {
    method: METHOD.POST,
    path: PATH.APPOINTMENTS,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: appointmentController.createNewAppointment,
  },
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: appointmentController.getSingleAppointment,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: appointmentController.updateAppointment,
  },
  {
    method: METHOD.DELETE,
    path: PATH.APPOINTMENT_ID,
    roles: [ROLE.ADMIN],
    handler: appointmentController.deleteAppointment,
  },
  {
    method: METHOD.GET,
    path: PATH.BEAUTICIAN_APPOINTMENT,
    roles: [ROLE.BEAUTICIAN],
    handler: appointmentController.getBeauticianAppointment,
  },
  {
    method:METHOD.GET,
    path: PATH.BEAUTICIAN_HISTORY,
    roles: [ROLE.BEAUTICIAN],
    handler: appointmentController.getAppointmentHistory
  }
];

appointmentRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
