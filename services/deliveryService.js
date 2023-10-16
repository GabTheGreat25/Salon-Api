const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const Delivery = require("../models/delivery");

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
  
    if (duplicateDelivery) throw new ErrorHandler("Duplicate company name");

    const delivery = await Delivery.create(req.body);

    return delivery;
  };

exports.updateDeliveryData = async(erq, res, id)=>{
  if (!mongoose.Types.ObjectId.isValid(id))
  throw new ErrorHandler(`Invalid delivey ID: ${id}`);

const existingDelivery = await Delivery.findById(id).lean().exec();

if (!existingDelivery)
  throw new ErrorHandler(`Delivery not found with ID: ${id}`);

const duplicateDelivery = await Delivery.findOne({
  name: req.body.company_name,
  _id: { $ne: id },
})
  .collation({ locale: "en" })
  .lean()
  .exec();

if (duplicateDelivery) throw new ErrorHandler("Duplicate company name");

const updatedDelivery = await Delivery.findByIdAndUpdate(
  id,
  {
    ...req.body,
  },
  {
    new: true,
    runValidators: true,
  }
)
  .lean()
  .exec();

if (!updatedDelivery)
  throw new ErrorHandler(`Delivery not found with ID: ${id}`);

return updatedDelivery;
}

exports.deleteDeliveryData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid delivery ID ${id}`);
  }

  const delivery = await Delivery.findOne({ _id: id });
  if (!delivery) throw new ErrorHandler(`Delivery not found with ID: ${id}`);


  return delivery;
};
