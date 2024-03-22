const Inventory = require("../models/inventory");
const ErrorHandler = require("../utils/errorHandler");
const { RESOURCE } = require("../constants/index");

exports.getAllInventoryData = async () => {
  const inventories = await Inventory.find()
    .sort({ createdAt: -1 })
    .populate({
      path: RESOURCE.APPOINTMENT,
      select: "_id date time",
    })
    .populate({
      path: "service",
      select: "service_name",
    })
    .populate({
      path: "product",
      select: "product_name",
    })
    .lean()
    .exec();

  return inventories;
};

exports.getSingleInventoryData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid inventory ID: ${id}`);

  const inventory = await Inventory.findById(id)
    .populate({
      path: RESOURCE.APPOINTMENT,
      select: "_id date time",
    })
    .populate({
      path: "service",
      select: "service_name",
    })
    .populate({
      path: "product",
      select: "product_name",
    })
    .lean()
    .exec();

  if (!inventory) throw new ErrorHandler(`Inventory not found with ID: ${id}`);

  return inventory;
};
