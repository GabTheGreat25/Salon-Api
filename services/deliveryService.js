const Delivery = require("../models/delivery");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllDeliveryData = async()=>{
    const deliveries = await Delivery.find().sort({ createdAt: -1}).lean().exec();

    return deliveries;
};

exports.getSingleDeliveryData = async(id)=>{
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ErrorHandler(`Invalid delivery ID ${id}`);
    }

    const delivery = await Delivery.findById(id).lean().exec();

    if(!delivery){
        throw new ErrorHandler(`Delivery not found with ID ${id}`);
    }

    return delivery;
};

exports.createDeliveryData = async (req, res) => {
    const duplicateDelivery = await Delivery.findOne({
      delivery: req.body.company_name,
    })
      .collation({ locale: "en" })
      .lean()
      .exec();
  
    if (duplicateDelivery) {
      throw new ErrorHandler("Duplicate company name");
    }
  
    const delivery = await Delivery.create({
      ...req.body,
    });
  
    return delivery;
  };

