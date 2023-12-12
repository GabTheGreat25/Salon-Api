const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

const feedbackRoutes = [
  {
    method: METHOD.GET,
    path: PATH.FEEDBACKS,
    roles: [],
    middleware: [],
    handler: feedbackController.getAllFeedbacks,
  },
  {
    method: METHOD.GET,
    path: PATH.FEEDBACK_ID,
    roles: [],
    middleware: [],
    handler: feedbackController.getSingleFeedback,
  },
  {
    method: METHOD.POST,
    path: PATH.FEEDBACKS,
    roles: [],
    middleware: [],
    handler: feedbackController.createNewFeedback,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_FEEDBACK_ID,
    roles: [],
    middleware: [],
    handler: feedbackController.updateFeedback,
  },
  {
    method: METHOD.DELETE,
    path: PATH.FEEDBACK_ID,
    roles: [],
    middleware: [],
    handler: feedbackController.deleteFeedback,
  },
];

feedbackRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
