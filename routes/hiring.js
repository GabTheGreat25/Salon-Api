const express = require("express");
const router = express.Router();
const hiringController = require("../controllers/hiringController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const testRoutes = [
  {
    method: METHOD.GET,
    path: PATH.HIRINGS,
    roles: [ROLE.ADMIN],
    handler: hiringController.getAllHiring,
  },
  {
    method: METHOD.GET,
    path: PATH.HIRING_ID,
    roles: [ROLE.ADMIN],
    handler: hiringController.getSingleHiring,
  },
  {
    method: METHOD.POST,
    path: PATH.HIRINGS,
    roles: [ROLE.ADMIN],
    handler: hiringController.createNewHiring,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_HIRING_ID,
    roles: [ROLE.ADMIN],
    handler: hiringController.updateHiring,
  },
  {
    method: METHOD.DELETE,
    path: PATH.HIRING_ID,
    roles: [ROLE.ADMIN],
    handler: hiringController.deleteHiring,
  },
];

testRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
