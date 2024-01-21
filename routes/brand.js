const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const { METHOD, PATH, ROLE } = require("../constants/index");
const { authorizeRoles } = require("../middleware/verifyJWT");

const brandRoutes = [
  {
    method: METHOD.GET,
    path: PATH.BRANDS,
    roles: [],
    middleware: [],
    handler: brandController.getAllBrands,
  },
  {
    method: METHOD.GET,
    path: PATH.BRAND_ID,
    roles: [],
    middleware: [],
    handler: brandController.getOneBrand
  },
  {
    method: METHOD.POST,
    path: PATH.BRANDS,
    roles: [],
    middleware: [],
    handler: brandController.createBrand
  },
  {
    method: METHOD.PATCH,
    path: PATH.BRAND_EDIT_ID,
    roles: [],
    middleware: [],
    handler: brandController.updateBrand
  },
  {
    method: METHOD.DELETE,
    path: PATH.BRAND_ID,
    roles: [],
    middleware: [],
    handler: brandController.deleteBrand
  }
];

brandRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
