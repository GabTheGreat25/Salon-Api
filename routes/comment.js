const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const commentRoutes = [
  {
    method: METHOD.GET,
    path: PATH.COMMENTS,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: commentController.getAllComments,
  },
  {
    method: METHOD.POST,
    path: PATH.COMMENTS,
    roles: [ROLE.ADMIN, ROLE.CUSTOMER],
    handler: commentController.createNewComment,
  },
  {
    method: METHOD.GET,
    path: PATH.COMMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: commentController.getSingleComment,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_COMMENT_ID,
    roles: [ROLE.ADMIN, ROLE.CUSTOMER],
    handler: commentController.updateComment,
  },
  {
    method: METHOD.DELETE,
    path: PATH.COMMENT_ID,
    roles: [ROLE.ADMIN, ROLE.BEAUTICIAN, ROLE.CUSTOMER, ROLE.RECEPTIONIST],
    handler: commentController.deleteComment,
  },
];

commentRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
