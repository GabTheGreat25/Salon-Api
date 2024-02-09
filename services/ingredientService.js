const Ingredient = require("../models/ingredient");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE, RESOURCE } = require("../constants/index");

exports.getAllIngredientData = async () => {
  const ingredients = await Ingredient.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand type",
    })
    .lean()
    .exec();

  return ingredients;
};

exports.getSingleIngredientData = async (id) => {
  if (!mongoose.Types.ObjectId)
    throw new ErrorHandler(`Invalid Ingredient ID ${id}`);

  const ingredient = await Ingredient.findById(id)
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand type",
    })
    .lean()
    .exec();

  if (!ingredient)
    throw new ErrorHandler(`Ingredient not found with ID: ${id}`);

  return ingredient;
};

exports.createIngredientData = async (req, res) => {
  const existingIngredient = await Ingredient.findOne({
    product: req.body.product,
  })
    .lean()
    .exec();

  if (existingIngredient)
    throw new ErrorHandler("An ingredient already exists for this product");

  const ingredient = await Ingredient.create({
    ...req.body,
  });

  await Ingredient.populate(ingredient, {
    path: RESOURCE.PRODUCT,
    select: "product_name brand type",
  });

  return ingredient;
};

exports.updateIngredientData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid ingredient ID: ${id}`);

  const existingIngredient = await Ingredient.findOne({
    product: req.body.product,
    _id: { $ne: id },
  })
    .lean()
    .exec();

  if (existingIngredient)
    throw new ErrorHandler("An ingredient already exists for this product");

  const updatedIngredient = await Ingredient.findByIdAndUpdate(
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
      select: "product_name brand type",
    })
    .lean()
    .exec();

  return updatedIngredient;
};

exports.deleteIngredientData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid ingredient ID ${id}`);

  const ingredient = await Ingredient.findOne({
    _id: id,
  });

  if (!ingredient)
    throw new ErrorHandler(`Ingredient not found with ID: ${id}`);

  const publicIds = ingredient.image.map((image) => image.public_id);

  const appointment = await Appointment.findOne({
    ingredient: id,
  });

  const appointmentId = appointment?._id;

  const transaction = await Transaction.findOne({
    appointment: appointmentId,
  });

  const transactionId = transaction?._id;

  await Promise.all([
    Ingredient.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
    Appointment.deleteOne({
      ingredient: id,
    })
      .lean()
      .exec(),
    Transaction.deleteOne({
      appointment: appointmentId,
    })
      .lean()
      .exec(),
    Verification.deleteMany({
      transaction: transactionId,
    })
      .lean()
      .exec(),
    Comment.deleteMany({
      transaction: transactionId,
    })
      .lean()
      .exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return ingredient;
};
