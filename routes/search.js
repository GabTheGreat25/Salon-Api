const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const searchRoutes = [
  {
    method: METHOD.GET,
    path: PATH.SEARCH_SERVICE_NAME,
    roles: [ROLE.ADMIN, ROLE.ONLINE_CUSTOMER],
    handler: searchController.SearchServices,
  },
];

searchRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
