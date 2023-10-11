const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");
const { METHOD, PATH } = require("../constants/index");

const serviceRoutes = [
  {
    method: METHOD.GET,
    path: PATH.SERVICE,
    handler: serviceController.getAllServices,
  },
  {
    method: METHOD.GET,
    path: PATH.SERVICE_ID,
    handler: serviceController.getSingleService,
  },
  {
    method: METHOD.POST,
    path: PATH.SERVICE,
    handler: serviceController.createNewService,
  },
  {
    method: METHOD.PUT,
    path: PATH.EDIT_SERVICE_ID,
    handler: serviceController.updateService,
  },
  {
    method: METHOD.DELETE,
    path: PATH.SERVICE_ID,
    handler: serviceController.deleteService,
  },
];

serviceRoutes.forEach((route) => {
  const { method, path, handler } = route;
  router[method](path, handler);
});

module.exports = router;
