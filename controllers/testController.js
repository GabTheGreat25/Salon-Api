const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const testServices = require("../services/testServices");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");

exports.getAllTests = asyncHandler(async (req, res, next) => {
  const tests = await testServices.getAllTestsData();

  return !tests?.length
    ? next(new ErrorHandler("No tests found"))
    : SuccessHandler(
        res,
        `Tests with test ${tests.map((u) => u.test).join(", ")} and IDs ${tests
          .map((u) => u._id)
          .join(", ")} retrieved`,
        tests
      );
});

exports.getSingleTest = asyncHandler(async (req, res, next) => {
  
  const test = await testServices.getSingleTestData(req.params?.id);

  return !test
    ? next(new ErrorHandler("No test found"))

    : SuccessHandler(
        res,
        `Test ${test?.test} with ID ${test?._id} retrieved`,
        test
      );
});

exports.createNewTest = [

  checkRequiredFields(["test"]),
  asyncHandler(async (req, res, next) => {
    const test = await testServices.CreateTestData(req);

    return SuccessHandler(
      res,
      `New test ${test?.test} created with an ID ${test?._id}`,
      test
    );
  }),
];

exports.updateTest = [
  checkRequiredFields(["test"]),
  asyncHandler(async (req, res, next) => {
    const test = await testServices.updateTestData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `Test ${test?.test} with ID ${test?._id} is updated`,
      test
    );
  }),
];

exports.deleteTest = asyncHandler(async (req, res, next) => {

  const test = await testServices.deleteTestData(req.params.id);

  return !test
    ? next(new ErrorHandler("No test found"))
    : SuccessHandler(
        res,
        `Test ${test?.test} with ID ${test?._id} is deleted`,
        test
      );
      
});
