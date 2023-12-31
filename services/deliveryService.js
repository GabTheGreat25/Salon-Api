const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const Delivery = require("../models/delivery");
const { RESOURCE } = require("../constants/index");

exports.getAllDeliveryData = async () => {
  const deliveries = await Delivery.find()
    .sort({
      createdAt: -1,
    })
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name",
    })
    .lean()
    .exec();

  return deliveries;
};

exports.getSingleDeliveryData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid delivery ID ${id}`);
  }

  const delivery = await Delivery.findById(id)
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name",
    })
    .lean()
    .exec();

  if (!delivery) throw new ErrorHandler(`Delivery not found with ID ${id}`);

  return delivery;
};

exports.createDeliveryData = async (req, res) => {
  const productValues = Array.isArray(req.body.product)
    ? req.body.product
    : req.body.product.split(", ");

  const delivery = await Delivery.create({
    ...req.body,
    product: productValues,
  });

  await Delivery.populate(delivery, {
    path: RESOURCE.PRODUCT,
    select: "product_name",
  });

  return delivery;
};

exports.updateDeliveryData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid delivery ID: ${id}`);

  const existingDelivery = await Delivery.findById(id).lean().exec();

  if (!existingDelivery)
    throw new ErrorHandler(`Delivery not found with ID: ${id}`);

  const productValues = Array.isArray(req.body.product)
    ? req.body.product
    : req.body.product.split(", ");

  const updatedDelivery = await Delivery.findByIdAndUpdate(
    id,
    {
      ...req.body,
      product: productValues,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name",
    })
    .lean()
    .exec();

  return updatedDelivery;
};

exports.deleteDeliveryData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid delivery ID ${id}`);

  const delivery = await Delivery.findOne({
    _id: id,
  });

  if (!delivery) throw new ErrorHandler(`Delivery not found with ID: ${id}`);

  await Promise.all([
    Delivery.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return delivery;
};
