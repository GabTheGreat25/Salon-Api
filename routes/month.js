const express = require("express");
const router = express.Router();
const monthController = require("../controllers/monthController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const monthRoutes = [
  {
    method: METHOD.GET,
    path: PATH.MONTHS,
    roles: [ROLE.ADMIN],
    handler: monthController.getAllMonths,
  },
  {
    method: METHOD.POST,
    path: PATH.MONTHS,
    roles: [ROLE.ADMIN],
    handler: monthController.createNewMonth,
  },
  {
    method: METHOD.GET,
    path: PATH.MONTH_ID,
    roles: [ROLE.ADMIN],
    handler: monthController.getSingleMonth,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_MONTH_ID,
    roles: [ROLE.ADMIN],
    handler: monthController.updateMonth,
  },
  {
    method: METHOD.DELETE,
    path: PATH.MONTH_ID,
    roles: [ROLE.ADMIN],
    handler: monthController.deleteMonth,
  },
];

monthRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
