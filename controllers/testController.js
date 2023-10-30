const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const testServices = require("../services/testServices");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { upload } = require("../utils/cloudinary");
const {
  STATUSCODE
} = require("../constants/index");

exports.getAllTests = asyncHandler(async (req, res, next) => {
  const tests = await testServices.getAllTestsData();

  return tests?.length === STATUSCODE.ZERO ?
    next(new ErrorHandler("No tests found")) :
    SuccessHandler(
      res,
      `Tests with test ${tests.map((u) => u.test).join(", ")} and IDs ${tests
          .map((u) => u._id)
          .join(", ")} retrieved`,
      tests
    );
});

exports.getSingleTest = asyncHandler(async (req, res, next) => {
  const test = await testServices.getSingleTestData(req.params?.id);

  return !test ?
    next(new ErrorHandler("No test found")) :
    SuccessHandler(
      res,
      `Test ${test?.test} with ID ${test?._id} retrieved`,
      test
    );
});

exports.createNewTest = [
  upload.array("image"),
  checkRequiredFields(["test"]),
  asyncHandler(async (req, res, next) => {
    const test = await testServices.createTestData(req);

    return SuccessHandler(
      res,
      `Created new Test ${test?.test} with an ID ${test?._id}`,
      test
    );
  }),
];

exports.updateTest = [
  upload.array("image"),
  checkRequiredFields(["test", "image"]),
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

  return !test ?
    next(new ErrorHandler("No test found")) :
    SuccessHandler(
      res,
      `Test ${test?.test} with ID ${test?._id} is deleted`,
      test
    );
});