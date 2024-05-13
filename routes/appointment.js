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
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.getAllAppointments,
  },
  {
    method: METHOD.POST,
    path: PATH.APPOINTMENTS,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.createNewAppointment,
  },
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.getSingleAppointment,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.updateAppointment,
  },
  {
    method: METHOD.PATCH,
    path: PATH.ACTIVATE_APPOINTMENT_ID,
    roles: [ROLE.ADMIN],
    handler: appointmentController.confirmRebook,
  },
  {
    method: METHOD.PATCH,
    path: PATH.SCHEDULE_EDIT_APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.updateScheduleAppointment,
  },
  {
    method: METHOD.PATCH,
    path: PATH.CANCEL_RESCHEDULE_APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.CUSTOMER],
    handler: appointmentController.cancelRebook,
  },
  {
    method: METHOD.PATCH,
    path: PATH.BEAUTICIAN_EDIT_APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.updateBeauticianAppointment,
  },
  {
    method: METHOD.DELETE,
    path: PATH.APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.RECEPTIONIST],
    handler: appointmentController.deleteAppointment,
  },
  {
    method: METHOD.GET,
    path: PATH.BEAUTICIAN_APPOINTMENT,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.getBeauticianAppointment,
  },
  {
    method: METHOD.GET,
    path: PATH.BEAUTICIAN_HISTORY,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.getAppointmentHistory,
  },
  {
    method: METHOD.GET,
    path: PATH.RESCHEDULE_APPOINTMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: appointmentController.getSingleRescheduleAppointment,
  },
];

appointmentRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
