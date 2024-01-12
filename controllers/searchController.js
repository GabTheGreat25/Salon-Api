const asyncHandler = require("express-async-handler");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const searchService = require("../services/searchService");

exports.SearchServices = asyncHandler(async (req, res, next) => {
  const services = await searchService.SearchServices(req.params.service_name);

  return !services  
    ? next(new ErrorHandler(`Service Not found`))
    : SuccessHandler(
        res,
        `Search Result ${services?.service_name}`,
        services
      );
});
