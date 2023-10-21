const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { METHOD, PATH } = require("../constants/index");

const testRoutes = [
  {
    method: METHOD.GET,
    path: PATH.COMMENT,
    handler: commentController.getAllComment
  },
  {
    method: METHOD.GET,
    path: PATH.COMMENT_ID,
    handler: commentController.getSingleComment
  },
  {
    method: METHOD.POST,
    path: PATH.COMMENT,
    handler: commentController.createNewComment
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_COMMENT_ID,
    handler: commentController.updateComment,
  },
  {
    method: METHOD.DELETE,
    path: PATH.COMMENT_ID,
    handler: commentController.deleteComment,
  },
];

testRoutes.forEach((route) => {
  const { method, path, handler } = route;
  router[method](path, handler);
});

module.exports = router;
