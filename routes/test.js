const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const { authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

const testRoutes = [
  {
    method: METHOD.GET,
    path: PATH.TESTS,
    roles: [],
    middleware: [],
    handler: testController.getAllTests,
  },
  {
    method: METHOD.GET,
    path: PATH.TEST_ID,
    roles: [],
    middleware: [],
    handler: testController.getSingleTest,
  },
  {
    method: METHOD.POST,
    path: PATH.TESTS,
    roles: [],
    middleware: [],
    handler: testController.createNewTest,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_TEST_ID,
    roles: [],
    middleware: [],
    handler: testController.updateTest,
  },
  {
    method: METHOD.DELETE,
    path: PATH.TEST_ID,
    roles: [],
    middleware: [],
    handler: testController.deleteTest,
  },
];

testRoutes.forEach((route) => {
  const { method, path, roles = [], middleware = [], handler } = route;
  router[method](path, middleware.concat(authorizeRoles(...roles)), handler);
});

module.exports = router;
