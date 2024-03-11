const express = require("express");
const router = express.Router();
const resupplyController = require("../controllers/resupplyController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");
router.use(verifyJWT);

const equipmentRoutes = [
  {
    method: METHOD.GET,
    path: PATH.RESUPPLIES,
    roles: [ROLE.ADMIN],
    handler: resupplyController.getAllResupply,
  },
  {
    method: METHOD.GET,
    path: PATH.RESUPPLY_ID,
    roles: [ROLE.ADMIN],
    handler: resupplyController.getSingleResupply,
  },
  {
    method: METHOD.POST,
    path: PATH.RESUPPLIES,
    roles: [ROLE.ADMIN],
    handler: resupplyController.createNewResupply,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_RESUPPLY_ID,
    roles: [ROLE.ADMIN],
    handler: resupplyController.updateResupply,
  },
  {
    method: METHOD.DELETE,
    path: PATH.RESUPPLY_ID,
    roles: [ROLE.ADMIN],
    handler: resupplyController.deleteResupply,
  },
];

equipmentRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
