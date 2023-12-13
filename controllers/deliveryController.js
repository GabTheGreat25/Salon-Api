const deliveryService = require("../services/deliveryService");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { STATUSCODE } = require("../constants/index");

exports.getAllDelivery = asyncHandler(async (req, res, next) => {
  const deliveries = await deliveryService.getAllDeliveryData();

  return deliveries?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No Deliveries Found"))
    : SuccessHandler(
        res,
        `Deliveries  of ${deliveries
          .map((delivery) => delivery?.compamy_name)
          .join(", ")} and ID's ${deliveries
          .map((delivery) => delivery?._id)
          .join(", ")}`,
        deliveries
      );
});

exports.getSingleDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await deliveryService.getSingleDeliveryData(req.params?.id);

  return !delivery
    ? next(new ErrorHandler("No delivery found"))
    : SuccessHandler(
        res,
        `delivery of ${delivery.company_name} and ID ${delivery?._id} retrieved`,
        delivery
      );
});

exports.createNewDelivery = [
  checkRequiredFields(["product", "company_name", "date", "price", "quantity"]),
  asyncHandler(async (req, res, next) => {
    const product = req.body.product || [];

    const delivery = await deliveryService.createDeliveryData(req, product);

    return SuccessHandler(
      res,
      `Created delivery with company name of ${delivery.company_name} and ID ${delivery?._id}`,
      delivery
    );
  }),
];

exports.updateDelivery = [
  checkRequiredFields([
    "product",
    "company_name",
    "date",
    "price",
    "status",
    "quantity",
  ]),
  asyncHandler(async (req, res, next) => {
    const product = req.body.product || [];

    const delivery = await deliveryService.updateDeliveryData(
      req,
      product,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Delivery of ${delivery.company_name} and ID ${delivery?._id} is updated`,
      delivery
    );
  }),
];

exports.deleteDelivery = asyncHandler(async (req, res, next) => {
  const delivery = await deliveryService.deleteDeliveryData(req.params.id);

  return !delivery
    ? next(new ErrorHandler("No Deliveries Found"))
    : SuccessHandler(
        res,
        `Delivery of ${delivery.company_name} and ID ${delivery?._id} is deleted`,
        delivery
      );
});
