const serviceService = require("../services/serviceService");
const ErrorHandler = require("../utils/errorHandler");
const SuccessHandler = require("../utils/successHandler");
const asyncHandler = require("express-async-handler");
const { STATUSCODE } = require("../constants/index");
const { upload } = require("../utils/cloudinary");
const checkRequiredFields = require("../helpers/checkRequiredFields");

exports.getAllServices = asyncHandler(async (req, res, next) => {
  const services = await serviceService.getAllServiceData();

  return services?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No Services found"))
    : SuccessHandler(
        res,
        `Services ${services
          .map((service) => service.service_name)
          .join(", ")} and ID's ${services
          .map((service) => service?._id)
          .join(", ")} retrieved`,
        services
      );
});

exports.getSingleService = asyncHandler(async (req, res, next) => {
  const service = await serviceService.getSingleServiceData(req.params?.id);

  return !service
    ? next(new ErrorHandler("No Service Found"))
    : SuccessHandler(
        res,
        `Service ${service.service_name} with ID ${service?._id} retrieved`,
        service
      );
});

exports.createNewService = [
  upload.array("image"),
  checkRequiredFields([
    "product",
    "service_name",
    "description",
    "price",
    "image",
  ]),
  asyncHandler(async (req, res) => {
    const product = req.body.product || [];

    const service = await serviceService.createServiceData(req, product);

    return SuccessHandler(
      res,
      `New service of ${service.service_name} is created with ID ${service?._id}`,
      service
    );
  }),
];

exports.updateService = [
  upload.array("image"),
  checkRequiredFields([
    "product",
    "service_name",
    "description",
    "price",
    "image",
  ]),
  asyncHandler(async (req, res, next) => {
    const product = req.body.product || [];

    const service = await serviceService.updateServiceData(
      req,
      product,
      res,
      req.params.id
    );

    return SuccessHandler(
      res,
      `Service ${service?.service_name} with ID ${service?._id} is updated`,
      service
    );
  }),
];

exports.deleteService = asyncHandler(async (req, res, next) => {
  const service = await serviceService.deleteServiceData(req.params.id);

  return !service
    ? next(new ErrorHandler("No service found"))
    : SuccessHandler(
        res,
        `Service ${service?.service_name} with ID ${service?._id} is deleted`,
        service
      );
});
