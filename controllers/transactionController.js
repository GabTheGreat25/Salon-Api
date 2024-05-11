const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const transactionsService = require("../services/transactionService");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");

exports.getAllTransactions = asyncHandler(async (req, res, next) => {
  const transactions = await transactionsService.getAllTransactionData();

  return transactions?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No transactions found"))
    : SuccessHandler(
        res,
        `Transactions of ${transactions
          .map((transaction) => transaction?.appointment?.customer?.name)
          .join(", ")} and IDs ${transactions
          .map((transaction) => transaction?._id)
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
        `Transaction of ${transaction?.appointment?.customer?.name} is ${transaction?.status}`,
        transaction
      );
});

exports.updateTransaction = [
  asyncHandler(async (req, res, next) => {
    const { existingTransaction, updatedTransaction, updateVerification } =
      await transactionsService.updateTransactionData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `Transaction of ${existingTransaction?.appointment?.customer?.name} is updated`,
      { transaction: updatedTransaction, updateVerification }
    );
  }),
];

exports.deleteTransaction = asyncHandler(async (req, res, next) => {
  const transaction = await transactionsService.getSingleTransactionData(
    req.params.id
  );

  const customerName = transaction?.appointment?.customer?.name || "Unknown";

  await transactionsService.deleteTransactionData(req.params.id);

  return !transaction
    ? next(new ErrorHandler("No transaction found"))
    : SuccessHandler(
        res,
        `transaction of ${customerName} is deleted`,
        transaction
      );
});
