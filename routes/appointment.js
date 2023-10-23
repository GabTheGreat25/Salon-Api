const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointmentController");
const {
    verifyJWT,
    authorizeRoles
} = require("../middleware/verifyJWT");
const {
    METHOD,
    PATH,
    ROLE
} = require("../constants/index");

const appointmentRoutes = [{
        method: METHOD.GET,
        path: PATH.APPOINTMENTS,
        roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
        middleware: [verifyJWT],
        handler: appointmentController.getAllAppointments,
    },
    {
        method: METHOD.POST,
        path: PATH.APPOINTMENTS,
        roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
        middleware: [verifyJWT],
        handler: appointmentController.createNewAppointment,
    },
    {
        method: METHOD.GET,
        path: PATH.APPOINTMENT_ID,
        roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
        middleware: [verifyJWT],
        handler: appointmentController.getSingleAppointment,
    },
    {
        method: METHOD.PATCH,
        path: PATH.EDIT_APPOINTMENT_ID,
        roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
        middleware: [verifyJWT],
        handler: appointmentController.updateAppointment,
    },
    {
        method: METHOD.DELETE,
        path: PATH.APPOINTMENT_ID,
        roles: [ROLE.ADMIN],
        middleware: [verifyJWT],
        handler: appointmentController.deleteAppointment,
    },
];

appointmentRoutes.forEach((route) => {
    const {
        method,
        path,
        roles = [],
        middleware = [],
        handler
    } = route;
    router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;