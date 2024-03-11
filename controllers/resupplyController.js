const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const resupplyService = require("../services/resupplyService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllResupply = asyncHandler(async (req, res, next) => {
  const resupplies = await resupplyService.getAllResupplyData();

  return resupplies?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No resupplies found"))
    : SuccessHandler(
        res,
        `Resupply with supplier name ${resupplies
          .map((r) => r.supplier_name)
          .join(", ")} and IDs ${resupplies
          .map((u) => u._id)
          .join(", ")} retrieved`,
        resupplies
      );
});

exports.getSingleResupply = asyncHandler(async (req, res, next) => {
  const resupply = await resupplyService.getSingleResupplyData(req.params?.id);

  return !resupply
    ? next(new ErrorHandler("No Resupply found"))
    : SuccessHandler(
        res,
        `Supplier ${resupply?.supplier_name} with ID ${resupply?._id} retrieved`,
        resupply
      );
});

exports.createNewResupply = [
  checkRequiredFields([
    "supplier_name",
    "equipment",
    "equipment_price",
    "status",
  ]),
  asyncHandler(async (req, res, next) => {
    const resupply = await resupplyService.createResupplyData(req);

    return SuccessHandler(
      res,
      `Equipment Resupply by ${resupply?.supplier_name} with an ID ${resupply?._id}`,
      resupply
    );
  }),
];

exports.updateResupply = [
  checkRequiredFields([
    "supplier_name",
    "equipment",
    "equipment_price",
    "status",
  ]),
  asyncHandler(async (req, res, next) => {
    const resupply = await resupplyService.updateResupplyData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Equipment Resupply delivered by ${resupply?.supplier_name} with ID ${resupply?._id} is updated`,
      resupply
    );
  }),
];

exports.deleteResupply = asyncHandler(async (req, res, next) => {
  const resupply = await resupplyService.deleteResupplyData(req.params.id);

  return !resupply
    ? next(new ErrorHandler("No resupply found"))
    : SuccessHandler(
        res,
        `Equipment resupply ${resupply?.supplier_name} with ID ${resupply?._id} is deleted`,
        resupply
      );
});
