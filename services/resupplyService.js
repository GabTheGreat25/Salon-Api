const Equipment = require("../models/equipment");
const Resupply = require("../models/resupply");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllResupplyData = async () => {
  const resupplies = await Resupply.find()
    .sort({
      createdAt: -1,
    })
    .lean()
    .exec();

  return resupplies;
};

exports.getSingleResupplyData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid resupply ID: ${id}`);

  const resupply = await Resupply.findById(id).lean().exec();

  if (!resupply) throw new ErrorHandler(`Resupply not found with ID: ${id}`);

  return resupply;
};

exports.createResupplyData = async (req, res) => {
  const equipment = await Equipment.findById(req.body.equipment);
  if (!equipment) throw new ErrorHandler("Equipment not found");

  if (equipment.quantity === 1) {
    throw new ErrorHandler("equipment still on stock");
  }

  const duplicateResupply = await Resupply.findOne({
    supplier_name: req.body.supplier_name,
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateResupply) throw new ErrorHandler("Duplicate Supplier name");

  const resupply = await Resupply.create({
    ...req.body,
  });

  return resupply;
};

exports.updateResupplyData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid resupply ID: ${id}`);

  const existingResupply = await Resupply.findById(id).lean().exec();

  if (!existingResupply)
    throw new ErrorHandler(`Resupply not found with ID: ${id}`);

  const duplicateResupply = await Resupply.findOne({
    supplier_name: req.body.supplier_name,
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateResupply) throw new ErrorHandler("Duplicate Resupply");

  const updatedResupply = await Resupply.findByIdAndUpdate(
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

  if (!updatedResupply)
    throw new ErrorHandler(`Resupply not found with ID: ${id}`);

  if (updatedResupply.status === "completed") {
    const equipment = await Equipment.findById(updatedResupply.equipment);
    if (!equipment)
      throw new ErrorHandler(
        `Equipment not found with ID: ${updatedResupply.equipment}`
      );

    equipment.quantity += updatedResupply.quantity;
    equipment.status = "Found";
    equipment.isAvailable = true;
    await equipment.save();
  }

  return updatedResupply;
};

exports.deleteResupplyData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid test ID ${id}`);

  const test = await Resupply.findOne({
    _id: id,
  });
  if (!test) throw new ErrorHandler(`Test not found with ID: ${id}`);

  await Promise.all([
    Resupply.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return test;
};
