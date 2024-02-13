const Exclusion = require("../models/exclusion");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllExclusionData = async () => {
  const exclusions = await Exclusion.find()
    .sort({
      createdAt: -1,
    })
    .lean()
    .exec();

  return exclusions;
};

exports.getSingleExclusionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid Exclusion ID: ${id}`);

  const exclusion = await Exclusion.findById(id).lean().exec();

  if (!exclusion) throw new ErrorHandler(`Exclusion not found with ID: ${id}`);

  return exclusion;
};

exports.createExclusionData = async (req, res) => {
  const duplicateExclusion = await Exclusion.findOne({
    ingredient_name: req.body.ingredient_name,
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateExclusion) throw new ErrorHandler("Duplicate Exclusion");

  const exclusion = await Exclusion.create({
    ...req.body,
  });

  return exclusion;
};

exports.updateExclusionData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid Exclusion ID: ${id}`);

  const existingExclusion = await Exclusion.findById(id).lean().exec();

  if (!existingExclusion)
    throw new ErrorHandler(`Exclusion not found with ID: ${id}`);

  const duplicateExclusion = await Exclusion.findOne({
    ingredient_name: req.body.ingredient_name,
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateExclusion) throw new ErrorHandler("Duplicate Exclusion");

  const updatedExclusion = await Exclusion.findByIdAndUpdate(
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

  if (!updatedExclusion)
    throw new ErrorHandler(`Exclusion not found with ID: ${id}`);

  return updatedExclusion;
};

exports.deleteExclusionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid Exclusion ID ${id}`);

  const exclusion = await Exclusion.findOne({
    _id: id,
  });
  if (!exclusion) throw new ErrorHandler(`Exclusion not found with ID: ${id}`);

  await Promise.all([
    Exclusion.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return exclusion;
};
