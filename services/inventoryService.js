const Inventory = require("../models/inventory");
const ErrorHandler = require("../utils/errorHandler");
const { RESOURCE, STATUSCODE } = require("../constants/index");

exports.getAllInventoryData = async () => {
  const inventories = await Inventory.find()
    .sort({ createdAt: STATUSCODE.NEGATIVE_ONE })
    .populate({
      path: RESOURCE.APPOINTMENT,
      select: "_id date time",
    })
    .populate({
      path: RESOURCE.SERVICE,
      select: "service_name image",
    })
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name volume_description image",
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
      path: RESOURCE.SERVICE,
      select: "service_name",
    })
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name volume_description",
    })
    .lean()
    .exec();

  if (!inventory) throw new ErrorHandler(`Inventory not found with ID: ${id}`);

  return inventory;
};
