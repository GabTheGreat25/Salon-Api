const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");
const brandServices = require("../services/brandService");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");


exports.getAllBrands = asyncHandler(async (req, res, next) => {
  const brands = await brandServices.getAllBrandsData();

  return !brands?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No brands found"))
    : SuccessHandler(
        res,
        `Brands ${brands
          .map((brand) => brand?.brand_name)
          .join(", ")} and ID's ${brands
          .map((brand) => brand?._id)
          .join(", ")} retrieved`,
        brands
      );
});

exports.getOneBrand = asyncHandler(async (req, res, next) => {
  const brand = await brandServices.getOneBrandData(req.params?.id);

  return !brand
    ? next(new ErrorHandler("Brand not found"))
    : SuccessHandler(res, `Brand with ${brand?._id} retrieved`, brand);
});

exports.createBrand = [
  asyncHandler(async (req, res, next) => {
    const brand = await brandServices.createBrandData(req);

    return SuccessHandler(
      res,
      `Created new brand ${brand?.brand_name} with ID ${brand?._id}`,
      brand
    );
  }),
];

exports.updateBrand = [
  checkRequiredFields(["brand_name"]),
  asyncHandler(async (req, res, next) => {
    const brand = await brandServices.updateBrandData(req, res, req.params.id);

    return SuccessHandler(
      res,
      `Test ${brand?.brand_name} with ID ${brand?._id} is updated`,
      brand
    );
  }),
];

exports.deleteBrand = asyncHandler(async (req, res, next) => {
  const brand = await brandServices.deleteBrandData(req.params.id);

  return !brand
    ? next(new ErrorHandler("No brand found"))
    : SuccessHandler(
        res,
        `Brand ${brand?.brand_name} with ID ${brand?._id} is deleted`,
        brand
      );
});
