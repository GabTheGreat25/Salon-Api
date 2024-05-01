const Found = require("../models/found");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllFoundsData = async () => {
  const founds = await Found.find()
    .sort({
      createdAt: -1,
    })
    .populate({
      path:"equipment",
      select:"equipment_name image"
    })
    .lean()
    .exec();

  return founds;
};

exports.getSingleFoundData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid found ID: ${id}`);

  const found = await Found.findById(id)
  .populate({
    path:"equipment",
    select:"equipment_name image"
  })
  .lean().exec();

  if (!found) throw new ErrorHandler(`Found Equipment records not found with ID: ${id}`);

  return found;
};

exports.createFoundData = async (req, res) => {
  const duplicateFound = await Found.findOne({
    found: req.body.found,
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateFound) throw new ErrorHandler("Duplicate found");


  const found = await Found.create({
    ...req.body,

  });

  return found;
};

exports.updateFoundData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid found ID: ${id}`);

  const existingFound = await Found.findById(id).lean().exec();

  if (!existingFound) throw new ErrorHandler(`found not found with ID: ${id}`);

  const updatedFound = await Found.findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .lean()
    .exec();

  if (!updatedFound) throw new ErrorHandler(`found not found with ID: ${id}`);

  return updatedFound;
};

exports.deleteFoundData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid found ID ${id}`);

  const found = await Found.findOne({
    _id: id,
  });
  if (!found) throw new ErrorHandler(`found not found with ID: ${id}`);

  await Promise.all([
    Found.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return found;
};
