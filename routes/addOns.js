const express = require("express");
const router = express.Router();
const addOnsController = require("../controllers/addOnsController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const addOnsRoutes = [
  {
    method: METHOD.GET,
    path: PATH.ADDONS,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: addOnsController.getAllAddOns,
  },
  {
    method: METHOD.GET,
    path: PATH.ADDON_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: addOnsController.getSingleAddOn,
  },
  {
    method: METHOD.POST,
    path: PATH.ADDONS,
    roles: [ROLE.ADMIN],
    handler: addOnsController.createNewAddOn,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_ADDON_ID,
    roles: [ROLE.ADMIN],
    handler: addOnsController.updateAddOn,
  },
  {
    method: METHOD.DELETE,
    path: PATH.ADDON_ID,
    roles: [ROLE.ADMIN],
    handler: addOnsController.deleteAddOn,
  },
];

addOnsRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
