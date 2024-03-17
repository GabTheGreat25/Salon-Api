const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const serviceRoutes = [
  {
    method: METHOD.GET,
    path: PATH.SERVICES,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: serviceController.getAllServices,
  },
  {
    method: METHOD.GET,
    path: PATH.SERVICE_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: serviceController.getSingleService,
  },
  {
    method: METHOD.POST,
    path: PATH.SERVICES,
    roles: [ROLE.ADMIN],
    handler: serviceController.createNewService,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_SERVICE_ID,
    roles: [ROLE.ADMIN],
    handler: serviceController.updateService,
  },
  {
    method: METHOD.DELETE,
    path: PATH.SERVICE_ID,
    roles: [ROLE.ADMIN],
    handler: serviceController.deleteService,
  },
];

serviceRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
