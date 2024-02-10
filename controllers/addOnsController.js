const addOnsService = require("../services/addOnsService");
const ErrorHandler = require("../utils/errorHandler");
const SuccessHandler = require("../utils/successHandler");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");
const { upload } = require("../utils/cloudinary");
const checkRequiredFields = require("../helpers/checkRequiredFields");

exports.getAllAddOns = asyncHandler(async (req, res, next) => {
  const addOns = await addOnsService.getAllAddOnsData();

  return addOns?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No AddOns found"))
    : SuccessHandler(
        res,
        `AddOns ${addOns
          .map((addOn) => addOn.addOns_name)
          .join(", ")} and IDs ${addOns
          .map((addOn) => addOn?._id)
          .join(", ")} retrieved`,
        addOns
      );
});

exports.getSingleAddOn = asyncHandler(async (req, res, next) => {
  const addOn = await addOnsService.getSingleAddOnsData(req.params?.id);

  return !addOn
    ? next(new ErrorHandler("No AddOn Found"))
    : SuccessHandler(
        res,
        `AddOn ${addOn.addOns_name} with ID ${addOn?._id} retrieved`,
        addOn
      );
});

exports.createNewAddOn = [
  upload.array("image"),
  checkRequiredFields([
    "service",
    "addOns_name",
    "description",
    "price",
    "image",
  ]),
  asyncHandler(async (req, res) => {
    const addOn = await addOnsService.createAddOnsData(req);

    return SuccessHandler(
      res,
      `New addOn of ${addOn.addOns_name} is created with ID ${addOn?._id}`,
      addOn
    );
  }),
];

exports.updateAddOn = [
  upload.array("image"),
  checkRequiredFields([
    "service",
    "addOns_name",
    "description",
    "price",
    "image",
  ]),
  asyncHandler(async (req, res, next) => {
    const addOn = await addOnsService.updateAddOnsData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `AddOn ${addOn?.addOns_name} with ID ${addOn?._id} is updated`,
      addOn
    );
  }),
];

exports.deleteAddOn = asyncHandler(async (req, res, next) => {
  const addOn = await addOnsService.deleteAddOnsData(req.params.id);

  return !addOn
    ? next(new ErrorHandler("No addOn found"))
    : SuccessHandler(
        res,
        `AddOn ${addOn?.addOns_name} with ID ${addOn?._id} is deleted`,
        addOn
      );
});
