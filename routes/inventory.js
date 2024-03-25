const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const inventoryRoute = [
  {
    method: METHOD.GET,
    path: PATH.INVENTORIES,
    roles: [ROLE.ADMIN],
    handler: inventoryController.getAllInventories,
  },
  {
    method: METHOD.GET,
    path: PATH.INVENTORY_ID,
    roles: [ROLE.ADMIN],
    handler: inventoryController.getSingleInventory,
  },
];

inventoryRoute.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
