const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const foundServices = require("../services/foundService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllFounds = asyncHandler(async (req, res, next) => {
  const founds = await foundServices.getAllFoundsData();

  return founds?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No founds found"))
    : SuccessHandler(
        res,
        `Equipments found  date ${founds
          .map((f) => f.date_found)
          .join(", ")} and IDs ${founds
          .map((f) => f._id)
          .join(", ")} retrieved`,
        founds
      );
});

exports.getSingleFound = asyncHandler(async (req, res, next) => {
  const found = await foundServices.getSingleFoundData(req.params?.id);

  return !found
    ? next(new ErrorHandler("No Found equipment records"))
    : SuccessHandler(
        res,
        `Found Equipment on  ${found?.date_found} with ID ${found?._id} retrieved`,
        found
      );
});

exports.createNewFound = [
  checkRequiredFields([
    "report",
    "equipment",
    "date_missing",
    "date_found",
    "quantity_found",
  ]),
  asyncHandler(async (req, res, next) => {
    const found = await foundServices.createFoundData(req);

    return SuccessHandler(
      res,
      `Created new Equipment Found with date found ${found?.date_found} with an ID ${found?._id}`,
      found
    );
  }),
];

exports.updateFound = [
  checkRequiredFields([
    "report",
    "equipment",
    "date_missing",
    "date_found",
    "quantity_found",
  ]),
  asyncHandler(async (req, res, next) => {
    const found = await foundServices.updateFoundData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `Equipment found records with date found ${found?.date_found} with ID ${found?._id} is updated`,
      found
    );
  }),
];

exports.deleteFound = asyncHandler(async (req, res, next) => {
  const found = await foundServices.deleteFoundData(req.params.id);

  return !found
    ? next(new ErrorHandler("No records for Equipments found"))
    : SuccessHandler(
        res,
        `Equipment found date ${found?.date_found} with ID ${found?._id} is deleted`,
        found
      );
});
