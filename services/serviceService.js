const Service = require("../models/service");
const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const Comment = require("../models/comment");
const Option = require("../models/option");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE, RESOURCE } = require("../constants/index");

exports.getAllServiceData = async () => {
  const services = await Service.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand isNew ingredients quantity",
    })
    .lean()
    .exec();

  return services;
};

exports.getSingleServiceData = async (id) => {
  if (!mongoose.Types.ObjectId)
    throw new ErrorHandler(`Invalid Service ID ${id}`);

  const service = await Service.findById(id)
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand isNew ingredients",
    })
    .lean()
    .exec();

  if (!service) throw new ErrorHandler(`Service not found with ID: ${id}`);

  return service;
};

exports.createServiceData = async (req, res) => {
  const duplicateService = await Service.findOne({
    service: req.body.service_name,
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateService) throw new ErrorHandler("Duplicate Service Name");

  let image = [];
  if (req.files && Array.isArray(req.files)) {
    image = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.secure_url,
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

  await Service.populate(service, {
    path: RESOURCE.PRODUCT,
    select: "product_name brand isNew ingredients",
  });

  return service;
};

exports.updateServiceData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid service ID: ${id}`);

  const existingService = await Service.findById(id).lean().exec();

  if (!existingService)
    throw new ErrorHandler(`Service not found with ID: ${id}`);

  const duplicateService = await Service.findOne({
    service_name: { $regex: new RegExp(`^${req.body.service_name}$`, "i") },
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateService) throw new ErrorHandler("Duplicate Service Name");

  let image = existingService.image || [];
  if (
    req.files &&
    Array.isArray(req.files) &&
    req.files.length > STATUSCODE.ZERO
  ) {
    image = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.secure_url,
          originalname: file.originalname,
        };
      })
    );

    if (
      existingService.image &&
      existingService.image.length > STATUSCODE.ZERO
    ) {
      await cloudinary.api.delete_resources(
        existingService.image.map((image) => image.public_id)
      );
    }
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
    .populate({
      path: RESOURCE.PRODUCT,
      select: "product_name brand isNew ingredients",
    })
    .lean()
    .exec();

  return updatedService;
};

exports.deleteServiceData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid service ID ${id}`);

  const service = await Service.findOne({
    _id: id,
  });

  if (!service) throw new ErrorHandler(`Service not found with ID: ${id}`);

  const publicIds = service.image.map((image) => image.public_id);

  const appointment = await Appointment.findOne({
    service: id,
  });

  const appointmentId = appointment?._id;

  const transaction = await Transaction.findOne({
    appointment: appointmentId,
  });

  const transactionId = transaction?._id;

  await Promise.all([
    Service.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
    Appointment.deleteOne({
      service: id,
    })
      .lean()
      .exec(),
    Transaction.deleteOne({
      appointment: appointmentId,
    })
      .lean()
      .exec(),
    Verification.deleteMany({
      transaction: transactionId,
    })
      .lean()
      .exec(),
    Comment.deleteMany({
      transaction: transactionId,
    })
      .lean()
      .exec(),
    Option.deleteMany({
      service: id,
    })
      .lean()
      .exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return service;
};
