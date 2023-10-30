const Test = require("../models/test");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const {
  cloudinary
} = require("../utils/cloudinary");
const {
  STATUSCODE
} = require("../constants/index");

exports.getAllTestsData = async () => {
  const tests = await Test.find().sort({
    createdAt: -1
  }).lean().exec();

  return tests;
};

exports.getSingleTestData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid test ID: ${id}`);

  const test = await Test.findById(id).lean().exec();

  if (!test) throw new ErrorHandler(`Test not found with ID: ${id}`);

  return test;
};

exports.createTestData = async (req, res) => {
  const duplicateTest = await Test.findOne({
      test: req.body.test
    })
    .collation({
      locale: "en"
    })
    .lean()
    .exec();

  if (duplicateTest) throw new ErrorHandler("Duplicate test");

  let image = [];
  if (req.files && Array.isArray(req.files)) {
    image = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      })
    );
  }

  if (image.length === STATUSCODE.ZERO)
    throw new ErrorHandler("At least one image is required");

  const test = await Test.create({
    ...req.body,
    image: image,
  });

  return test;
};

exports.updateTestData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid test ID: ${id}`);

  let image = existingProduct.image || [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    image = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      })
    );

    await cloudinary.api.delete_resources(
      existingProduct.image.map((image) => image.public_id)
    );
  }

  const updatedTest = await Test.findByIdAndUpdate(id, {
      ...req.body,
      image: image,
    }, {
      new: true,
      runValidators: true,
    })
    .lean()
    .exec();

  if (!updatedTest) throw new ErrorHandler(`Test not found with ID: ${id}`);

  const duplicateTest = await Test.findOne({
      test: req.body.test,
      _id: {
        $ne: id
      },
    })
    .collation({
      locale: "en"
    })
    .lean()
    .exec();

  if (duplicateTest) throw new ErrorHandler("Duplicate test");

  return updatedTest;
};

exports.deleteTestData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ErrorHandler(`Invalid test ID ${id}`);

  const test = await Test.findOne({
    _id: id
  });
  if (!test) throw new ErrorHandler(`Test not found with ID: ${id}`);

  const publicIds = test.image.map((image) => image.public_id);

  await Promise.all([
    Test.deleteOne({
      _id: id
    }).lean().exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return test;
};