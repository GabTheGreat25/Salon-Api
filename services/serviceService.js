const Service = require('../models/service');
const mongoose = require('mongoose');
const ErrorHandler = require('../utils/errorHandler');
const { cloudinary } = require('../utils/cloudinary');
const { STATUSCODE } = require('../constants/index');


exports.getAllServiceData = async()=>{
    const services = await Service.find().sort({ createdAt: -1}).lean().exec()

    return services;
};

exports.getSingleServiceData = async(id)=>{
    if(!mongoose.Types.ObjectId){
        throw new ErrorHandler(`Invalid Service ID ${id}`)
    }

    const service = await Service.findById().lean().exec()

    if(!service){
        throw new ErrorHandler(`Service not found with ID: ${id}`)
    }

    return service;
}; 

exports.createServiceData = async(req, res)=>{
    const duplicateService = await Service.findOne({
        service: req.body.service_name,
    })
    .collation({ locale: "en"})
    .lean()
    .exec();

    if(duplicateService){
        throw  new ErrorHandler("Duplicate Service Name");
    }

    let image = [];
  if (req.files && Array.isArray(req.files)) {
    image = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      })
    );
  }

  if (image.length === STATUSCODE.ZERO)
    throw new ErrorHandler("At least one image is required");

  const service = await Service.create({
    ...req.body,
    image: image,
  });

  return service;
};

exports.updateServiceData = async(req, res, id)=>{
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid service ID: ${id}`);

  const existingService = await Service.findById(id).lean().exec();

  if (!existingService)
    throw new ErrorHandler(`Service not found with ID: ${id}`);

  const duplicateService = await Service.findOne({
    name: req.body.service_name,
    _id: { $ne: id },
  })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateService) throw new ErrorHandler("Duplicate service name");

  let image = existingProduct.image || [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    image = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      })
    );

    await cloudinary.api.delete_resources(
      existingService.image.map((image) => image.public_id)
    );
  }
  const updatedService = await Service.findByIdAndUpdate(
    id,
    {
      ...req.body,
      image: image,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .lean()
    .exec();

  if (!updatedService)
    throw new ErrorHandler(`Product not found with ID: ${id}`);

  return updatedService;
};

exports.deleteServiceData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid service ID ${id}`);
  }

  const service = await Service.findOne({ _id: id });
  if (!service) throw new ErrorHandler(`Service not found with ID: ${id}`);

  const publicIds = service.image.map((image) => image.public_id);

  await Promise.all([
    Service.deleteOne({ _id: id }).lean().exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return service;
};