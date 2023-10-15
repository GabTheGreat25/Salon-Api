const deliveryService = require("../services/deliveryService");
const SuccessHandler = require("../utils/successHandler");
const ErrorHandler = require("../utils/errorHandler");
const asyncHandler = require("express-async-handler");
const checkRequiredFields = require("../helpers/checkRequiredFields");
const { upload } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllDelivery = asyncHandler(async(req, res, next)=>{
    const deliveries = await deliveryService.getAllDeliveryData();

    return deliveries?.length === STATUSCODE.ZERO
    ? next(new ErrorHandler("No Deliveries Found"))
    : SuccessHandler(
        res
        `Deliveries with company name ${deliveries
        .map((d)=> d?.compamy_name)
        .join(", ")} and ID's ${deliveries
        .map((d)=> d?._id)
        .join(", ")}`,
        deliveries
    );
});

exports.getSingleDelivery = asyncHandler(async(req, res, next)=>{
    const delivery = await deliveryService.getSingleDeliveryData(req.params?.id);

    return !delivery
    ? next(new ErrorHandler("No delivery found"))
    : SuccessHandler(
        res,
        `Delivery with ${delivery.company_name} and ID ${delivery?._id} retrieved`,
        delivery
        );
});