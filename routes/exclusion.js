const express = require("express");
const router = express.Router();
const exclusionController = require("../controllers/exclusionController");
const { METHOD, PATH, ROLE } = require("../constants/index");
const { authorizeRoles } = require("../middleware/verifyJWT");

const exclusionRoutes = [
  {
    method: METHOD.GET,
    path: PATH.EXCLUSIONS,
    roles: [],
    middleware: [],
    handler: exclusionController.getAllExclusions,
  },
  {
    method: METHOD.GET,
    path: PATH.EXCLUSION_ID,
    roles: [],
    middleware: [],
    handler: exclusionController.getSingleExclusion,
  },
  {
    method: METHOD.POST,
    path: PATH.EXCLUSIONS,
    roles: [],
    middleware: [],
    handler: exclusionController.createNewExclusion,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_EXCLUSION_ID,
    roles: [],
    middleware: [],
    handler: exclusionController.updateExclusion,
  },
  {
    method: METHOD.DELETE,
    path: PATH.EXCLUSION_ID,
    roles: [],
    middleware: [],
    handler: exclusionController.deleteExclusion,
  },
];

exclusionRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
