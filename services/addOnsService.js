const AddOns = require("../models/addOns");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { STATUSCODE, RESOURCE } = require("../constants/index");

exports.getAllAddOnsData = async () => {
  const addOnss = await AddOns.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand isNew type",
    })
    .lean()
    .exec();

  return addOnss;
};

exports.getSingleAddOnsData = async (id) => {
  if (!mongoose.Types.ObjectId)
    throw new ErrorHandler(`Invalid AddOns ID ${id}`);

  const addOns = await AddOns.findById(id)
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand isNew type",
    })
    .lean()
    .exec();

  if (!addOns) throw new ErrorHandler(`AddOns not found with ID: ${id}`);

  return addOns;
};

exports.createAddOnsData = async (req, res) => {
  const addOns = await AddOns.create({
    ...req.body,
  });

  await AddOns.populate(addOns, {
    path: RESOURCE.PRODUCT,
    select: "product_name brand isNew type",
  });

  return addOns;
};

exports.updateAddOnsData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid addOns ID: ${id}`);

  const existingAddOns = await AddOns.findById(id).lean().exec();

  if (!existingAddOns)
    throw new ErrorHandler(`AddOns not found with ID: ${id}`);

  const updatedAddOns = await AddOns.findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand isNew type",
    })
    .lean()
    .exec();

  return updatedAddOns;
};

exports.deleteAddOnsData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid addOns ID ${id}`);

  const addOns = await AddOns.findOne({
    _id: id,
  });

  if (!addOns) throw new ErrorHandler(`AddOns not found with ID: ${id}`);

  await Promise.all([
    AddOns.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return addOns;
};
