const express = require("express");
const router = express.Router();
const ingredientController = require("../controllers/ingredientController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const ingredientRoutes = [
  {
    method: METHOD.GET,
    path: PATH.INGREDIENTS,
    roles: [],
    handler: ingredientController.getAllIngredients,
  },
  {
    method: METHOD.GET,
    path: PATH.INGREDIENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN],
    handler: ingredientController.getSingleIngredient,
  },
  {
    method: METHOD.POST,
    path: PATH.INGREDIENTS,
    roles: [ROLE.ADMIN],
    handler: ingredientController.createNewIngredient,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_INGREDIENT_ID,
    roles: [ROLE.ADMIN],
    handler: ingredientController.updateIngredient,
  },
  {
    method: METHOD.DELETE,
    path: PATH.INGREDIENT_ID,
    roles: [ROLE.ADMIN],
    handler: ingredientController.deleteIngredient,
  },
];

ingredientRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
