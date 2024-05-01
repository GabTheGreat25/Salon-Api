const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");
router.use(verifyJWT);

const reportRoutes = [
  {
    method: METHOD.GET,
    path: PATH.REPORTS,
    roles: [ROLE.ADMIN, ROLE.RECEPTIONIST],
    handler: reportController.getAllReports,
  },
  {
    method: METHOD.POST,
    path: PATH.REPORTS,
    roles: [ROLE.ADMIN, ROLE.RECEPTIONIST],
    handler: reportController.createReport,
  },
  {
    method: METHOD.GET,
    path: PATH.REPORT_ID,
    roles: [ROLE.ADMIN, ROLE.RECEPTIONIST],
    handler: reportController.getOneReport,
  },
  {
    method: METHOD.PATCH,
    path: PATH.REPORT_EDIT_ID,
    roles: [ROLE.ADMIN, ROLE.RECEPTIONIST],
    handler: reportController.updateReport,
  },
  {
    method: METHOD.DELETE,
    path: PATH.REPORT_ID,
    roles: [ROLE.ADMIN, ROLE.RECEPTIONIST],
    handler: reportController.deleteReport,
  },
];

reportRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
