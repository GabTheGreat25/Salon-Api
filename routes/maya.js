const express = require("express");
const router = express.Router();
const mayaController = require("../controllers/mayaController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const mayaRoutes = [
  {
    method: METHOD.POST,
    path: PATH.MAYA,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE, ROLE.CUSTOMER],
    handler: mayaController.createNewMayaCheckout,
  },
];

mayaRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
