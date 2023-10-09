const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const productService = require("../services/productService");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllProducts = asyncHandler(async (req, res, next) => {
  const products = await productService.getAllProductData();

  return products?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No products found"))
    : SuccessHandler(
        res,
        `Products with product ${products
          .map((p) => p?.product_name)
          .join(", ")} and IDs ${products
          .map((p) => p?._id)
          .join(", ")} retrieved`,
        products
      );
});

exports.getSingleProduct = asyncHandler(async (req, res, next) => {
  const product = await productService.getSingleProductData(req.params?.id);

  return !product
    ? next(new ErrorHandler("No product found"))
    : SuccessHandler(
        res,
        `Product ${product?.product_name} with ID ${product?._id} retrieved`,
        product
      );
});

exports.createNewProduct = [
  upload.array("image"),
  checkRequiredFields(["product_name", "brand", "type", "quantity", "image"]),
  asyncHandler(async (req, res, next) => {
    const product = await productService.createProductData(req);

    return SuccessHandler(
      res,
      `Created new Product ${product?.product_name} with an ID ${product?._id}`,
      product
    );
  }),
];

exports.updateProduct = [
  upload.array("image"),
  checkRequiredFields(["product_name", "brand", "type", "quantity", "image"]),
  asyncHandler(async (req, res, next) => {
    const product = await productService.updateProductData(
      req,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Product ${product?.product_name} with ID ${product?._id} is updated`,
      product
    );
  }),
];

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const product = await productService.deleteProductData(req.params.id);

  return !product
    ? next(new ErrorHandler("No product found"))
    : SuccessHandler(
        res,
        `Product ${product?.product_name} with ID ${product?._id} is deleted`,
        product
      );
});
