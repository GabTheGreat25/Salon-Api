const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const Delivery = require("../models/delivery");
const Product = require("../models/product");
const { RESOURCE, STATUSCODE } = require("../constants/index");

exports.getAllDeliveryData = async () => {
  const deliveries = await Delivery.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
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
  const delivery = await Delivery.create({
    ...req.body,
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

  const updatedDelivery = await Delivery.findByIdAndUpdate(
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
      select: "product_name",
    })
    .lean()
    .exec();

  if (updatedDelivery.status === "completed") {
    for (const productId of updatedDelivery.product) {
      const product = await Product.findById(productId);

      if (product.volume_description === "Pieces") {
        product.quantity += req.body.quantity;
        product.remaining_volume += req.body.quantity;
      } else {
        product.quantity += req.body.quantity;
      }

      await product.save();
    }
  }

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
