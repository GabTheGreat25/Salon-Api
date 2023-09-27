const Test = require("../models/test");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllTestsData = async () => {
  const tests = await Test.find().sort({ createdAt: -1 }).lean().exec();

  return tests;
};

exports.getSingleTestData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid test ID: ${id}`);

  const test = await Test.findById(id).lean().exec();

  if (!test) throw new ErrorHandler(`Test not found with ID: ${id}`);

  return test;
};

exports.CreateTestData = async (req, res) => {
  const duplicateTest = await Test.findOne({ test: req.body.test })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateTest) throw new ErrorHandler("Duplicate test");

  const test = await Test.create(req.body);

  return test;
};

exports.updateTestData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid test ID: ${id}`);

  const updatedTest = await Test.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  })
    .lean()
    .exec();

  if (!updatedTest) throw new ErrorHandler(`Test not found with ID: ${id}`);

  const duplicateTest = await Test.findOne({
    test: req.body.test,
    _id: { $ne: id },
  })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateTest) throw new ErrorHandler("Duplicate test");

  return updatedTest;
};

exports.deleteTestData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    return next(new ErrorHandler(`Invalid test ID: ${id}`));

  if (!id) return next(new ErrorHandler(`Test not found with ID: ${id}`));

  const test = await Test.findOneAndDelete({ _id: id }).lean().exec();

  return test;
};
