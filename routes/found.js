const express = require("express");
const router = express.Router();
const foundController = require("../controllers/foundController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const foundRouter = [
  {
    method: METHOD.GET,
    path: PATH.FOUNDS,
    roles: [ROLE.ADMIN],
    handler: foundController.getAllFounds,
  },
  {
    method: METHOD.POST,
    path: PATH.FOUNDS,
    roles: [ROLE.ADMIN],
    handler: foundController.createNewFound,
  },
  {
    method: METHOD.GET,
    path: PATH.FOUND_ID,
    roles: [ROLE.ADMIN],
    handler: foundController.getSingleFound,
  },
  {
    method: METHOD.PATCH,
    path: PATH.FOUND_EDIT_ID,
    roles: [ROLE.ADMIN],
    handler: foundController.updateFound,
  },

  {
    method: METHOD.DELETE,
    path: PATH.FOUND_ID,
    roles: [ROLE.ADMIN],
    handler: foundController.deleteFound,
  },
];

foundRouter.forEach((route)=>{
    const { method, path, roles, handler } = route;
    router[method](path, authorizeRoles(...roles), handler);
})

module.exports = router;
