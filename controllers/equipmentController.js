const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const equipmentServices = require("../services/equipmentService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllEquipments = asyncHandler(async (req, res, next) => {
  const equipments = await equipmentServices.getAllEquipmentData();

  return equipments?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No equipments found"))
    : SuccessHandler(
        res,
        `Equipments with equipment name ${equipments
          .map((e) => e.equipment_name)
          .join(", ")} and IDs ${equipments
          .map((u) => u._id)
          .join(", ")} retrieved`,
        equipments
      );
});

exports.getSingleEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await equipmentServices.getSingleEquipmentData(
    req.params?.id
  );

  return !equipment
    ? next(new ErrorHandler("No equipment found"))
    : SuccessHandler(
        res,
        `Equipment ${equipment?.equipment_name} with ID ${equipment?._id} retrieved`,
        equipment
      );
});

exports.createNewEquipment = [
  upload.array("image"),
  checkRequiredFields([
    "equipment_name",
    "equipment_price",
    "quantity",
    "image",
  ]),
  asyncHandler(async (req, res, next) => {
    const equipment = await equipmentServices.createEquipmentData(req);

    return SuccessHandler(
      res,
      `Created a new Equipment ${equipment?.equipment_name}`,
      equipment
    );
  }),
];

exports.updateEquipment = [
  upload.array("image"),
  checkRequiredFields([
    "equipment_name",
    "equipment_price",
    "quantity",
    "image",
  ]),
  asyncHandler(async (req, res, next) => {
    const equipment = await equipmentServices.updateEquipmentData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Equipment ${equipment?.equipment_name} is updated`,
      equipment
    );
  }),
];

exports.deleteEquipment = asyncHandler(async (req, res, next) => {
  const equipment = await equipmentServices.deleteEquipmentData(req.params.id);

  return !equipment
    ? next(new ErrorHandler("No equipment found"))
    : SuccessHandler(
        res,
        `Equipment ${equipment?.equipment_name} is deleted`,
        equipment
      );
});
