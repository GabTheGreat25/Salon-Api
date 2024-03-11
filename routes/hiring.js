const express = require("express");
const router = express.Router();
const hiringController = require("../controllers/hiringController");
const { authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

const hiringRoutes = [
  {
    method: METHOD.GET,
    path: PATH.HIRINGS,
    roles: [],
    middleware: [],
    handler: hiringController.getAllHiring,
  },
  {
    method: METHOD.GET,
    path: PATH.HIRING_ID,
    roles: [],
    middleware: [],
    handler: hiringController.getSingleHiring,
  },
  {
    method: METHOD.POST,
    path: PATH.HIRINGS,
    roles: [],
    middleware: [],
    handler: hiringController.createNewHiring,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_HIRING_ID,
    roles: [],
    middleware: [],
    handler: hiringController.updateHiring,
  },
  {
    method: METHOD.DELETE,
    path: PATH.HIRING_ID,
    roles: [],
    middleware: [],
    handler: hiringController.deleteHiring,
  },
];

hiringRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
