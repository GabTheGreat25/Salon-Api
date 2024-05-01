const inventoryService = require("../services/inventoryService");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");

exports.getAllInventories = asyncHandler(async (req, res, next) => {
  const inventories = await inventoryService.getAllInventoryData();

  return inventories?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No inventories found"))
    : SuccessHandler(
        res,
        `Inventory with Appointment ID ${inventories.map((a) => a.appointment?._id).join(", ")} and Inventory ID ${inventories
          .map((i) => i._id)
          .join(", ")} retrieved`,
        inventories
      );
});

exports.getSingleInventory = asyncHandler(async (req, res, next) => {
    const inventory = await inventoryService.getSingleInventoryData(req.params?.id);
  
    return !inventory
      ? next(new ErrorHandler("No inventory found"))
      : SuccessHandler(
          res,
          `inventory with Appointment ID ${inventory?.appointment?._id} with inventory ID ${inventory?._id} retrieved`,
          inventory
        );
  });
