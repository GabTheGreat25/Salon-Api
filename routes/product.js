const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const productRoutes = [
  {
    method: METHOD.GET,
    path: PATH.PRODUCTS,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
    handler: productController.getAllProducts,
  },
  {
    method: METHOD.POST,
    path: PATH.PRODUCTS,
    roles: [ROLE.ADMIN],
    handler: productController.createNewProduct,
  },
  {
    method: METHOD.GET,
    path: PATH.PRODUCT_ID,
    roles: [ROLE.ADMIN, ROLE.EMPLOYEE],
    handler: productController.getSingleProduct,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_PRODUCT_ID,
    roles: [ROLE.ADMIN],
    handler: productController.updateProduct,
  },

  {
    method: METHOD.DELETE,
    path: PATH.PRODUCT_ID,
    roles: [ROLE.ADMIN],
    handler: productController.deleteProduct,
  },
];

productRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
