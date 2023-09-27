const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const { METHOD, PATH } = require("../constants/index");

const testRoutes = [
  {
    method: METHOD.GET,
    path: PATH.TESTS,
    handler: testController.getAllTests,
  },
  {
    method: METHOD.GET,
    path: PATH.TEST_ID,
    handler: testController.getSingleTest,
  },
  {
    method: METHOD.POST,
    path: PATH.TESTS,
    handler: testController.createNewTest,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_TEST_ID,
    handler: testController.updateTest,
  },
  {
    method: METHOD.DELETE,
    path: PATH.TEST_ID,
    handler: testController.deleteTest,
  },
];

testRoutes.forEach((route) => {
  const { method, path, handler } = route;
  router[method](path, handler);
});

module.exports = router;
