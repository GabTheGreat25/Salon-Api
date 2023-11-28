const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const deliveryRoutes = [
  {
    method: METHOD.GET,
    path: PATH.DELIVERY,
    roles: [ROLE.ADMIN],
    handler: deliveryController.getAllDelivery,
  },
  {
    method: METHOD.GET,
    path: PATH.DELIVERY_ID,
    roles: [ROLE.ADMIN],
    handler: deliveryController.getSingleDelivery,
  },
  {
    method: METHOD.POST,
    path: PATH.DELIVERY,
    roles: [ROLE.ADMIN],
    handler: deliveryController.createNewDelivery,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_DELIVERY_ID,
    roles: [ROLE.ADMIN],
    handler: deliveryController.updateDelivery,
  },
  {
    method: METHOD.DELETE,
    path: PATH.DELIVERY_ID,
    roles: [ROLE.ADMIN],
    handler: deliveryController.deleteDelivery,
  },
];

deliveryRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
