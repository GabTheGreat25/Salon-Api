const express = require("express");
const router = express.Router();
const logbookController = require("../controllers/logbookController");
const { METHOD, PATH } = require("../constants/index");

const logbookRoutes = [
  {
    method: METHOD.GET,
    path: PATH.LOGBOOK,
    handler: logbookController.getAllLogs,
  },
  {
    method: METHOD.GET,
    path: PATH.LOGBOOK_ID,
    handler: logbookController.getOneLog,
  },
  {
    method: METHOD.POST,
    path: PATH.LOGBOOK,
    handler: logbookController.createLogBook,
  },
  {
    method: METHOD.PATCH,
    path: PATH.LOGBOOK_EDIT_ID,
    handler: logbookController.updateLogBook,
  },
  {
    method: METHOD.DELETE,
    path: PATH.LOGBOOK_ID,
    handler: logbookController.deleteLogBook,
  },
];

logbookRoutes.forEach((route) => {
  const { method, path, handler } = route;
  router[method](path, handler);
});

module.exports = router;
