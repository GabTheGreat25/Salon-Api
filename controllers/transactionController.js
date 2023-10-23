const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const transactionsService = require("../services/transactionService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await transactionsService.getAllTransactionData();

  return transactions?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No transactions found"))
    : SuccessHandler(
        res,
        `Transactions with transaction ${transactions
          .map((p) => p?.customer?.name)
          .join(", ")} and IDs ${transactions
          .map((p) => p?._id)
          .join(", ")} retrieved`,
        transactions
      );
});

exports.getSingleTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await transactionsService.getSingleTransactionData(
    req.params.id
  );

  return !transaction
    ? next(new ErrorHandler("No transaction found"))
    : SuccessHandler(
        res,
        `Transaction of ${transaction?.customer?.name} is ${transaction?.status}`,
        transaction
      );
});

exports.createNewTransaction = [
    checkRequiredFields(["date", "time", "payment" ,"customer", "appointment"]),
    asyncHandler(async (req, res, next) => {
      const transaction = await transactionsService.createTransactionData(req);
  
      return SuccessHandler(
        res,
        `New transaction of ${transaction?.customer?.name} created with an ID ${transaction?._id}`,
        transaction
      );
    }),
  ];

exports.updateTransaction = [
  checkRequiredFields(["date", "time", "payment" ,"customer", "appointment"]),
  asyncHandler(async (req, res, next) => {
    const transaction = await transactionsService.updateTransactionData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `transaction of ${transaction?.customer?.name} with an ID ${transaction?._id} is updated`,
      transaction
    );
  }),
];

exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await transactionsService.deleteTransactionData(
    req.params.id
  );

  return !transaction
    ? next(new ErrorHandler("No transaction found"))
    : SuccessHandler(
        res,
        `transaction of ${transaction?.customer?.name} with an ID ${transaction?._id} is deleted`,
        transaction
      );
});