const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const transactionRoutes = [
  {
    method: METHOD.GET,
    path: PATH.TRANSACTIONS,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: transactionController.getAllTransactions,
  },
  {
    method: METHOD.GET,
    path: PATH.TRANSACTION_ID,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: transactionController.getSingleTransaction,
  },
  {
    method: METHOD.PATCH,
    path: PATH.EDIT_TRANSACTION_ID,
    roles: [
      ROLE.ADMIN,
      ROLE.BEAUTICIAN,
      ROLE.ONLINE_CUSTOMER,
      ROLE.WALK_IN_CUSTOMER,
    ],
    handler: transactionController.updateTransaction,
  },
  {
    method: METHOD.DELETE,
    path: PATH.TRANSACTION_ID,
    roles: [ROLE.ADMIN],
    handler: transactionController.deleteTransaction,
  },
];

transactionRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});
module.exports = router;
