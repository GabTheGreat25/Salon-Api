const express = require("express");
const router = express.Router();
const optionController = require("../controllers/optionController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const optionRoutes = [
  {
    method: METHOD.GET,
    path: PATH.OPTIONS,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: optionController.getAllOption,
  },
  {
    method: METHOD.GET,
    path: PATH.OPTION_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: optionController.getSingleOption,
  },
  {
    method: METHOD.POST,
    path: PATH.OPTIONS,
    roles: [ROLE.ADMIN],
    handler: optionController.createNewOption,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_OPTION_ID,
    roles: [ROLE.ADMIN],
    handler: optionController.updateOption,
  },
  {
    method: METHOD.DELETE,
    path: PATH.OPTION_ID,
    roles: [ROLE.ADMIN],
    handler: optionController.deleteOption,
  },
];

optionRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
