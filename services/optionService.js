const Option = require("../models/option");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { STATUSCODE, RESOURCE } = require("../constants/index");
const { cloudinary } = require("../utils/cloudinary");

exports.getAllOptionData = async () => {
  const options = await Option.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.SERVICE,
      select: "service_name",
    })
    .lean()
    .exec();

  return options;
};

exports.getSingleOptionData = async (id) => {
  if (!mongoose.Types.ObjectId)
    throw new ErrorHandler(`Invalid Option ID ${id}`);

  const option = await Option.findById(id)
    .populate({
      path: RESOURCE.SERVICE,
      select: "service_name",
    })
    .lean()
    .exec();

  if (!option) throw new ErrorHandler(`Option not found with ID: ${id}`);

  return option;
};

exports.createOptionData = async (req, res) => {
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

  const option = await Option.create({
    ...req.body,
    image: image,
  });

  await Option.populate(option, {
    path: RESOURCE.SERVICE,
    select: "service_name",
  });

  return option;
};

exports.updateOptionData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid option ID: ${id}`);

  const existingOption = await Option.findById(id).lean().exec();

  if (!existingOption)
    throw new ErrorHandler(`Option not found with ID: ${id}`);

  let image = existingOption.image || [];
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
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

    if (existingOption.image && existingOption.image.length > 0) {
      await cloudinary.api.delete_resources(
        existingOption.image.map((image) => image.public_id)
      );
    }
  }

  const updatedOption = await Option.findByIdAndUpdate(
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
      path: RESOURCE.SERVICE,
      select: "service_name",
    })
    .lean()
    .exec();

  return updatedOption;
};

exports.deleteOptionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid option ID ${id}`);

  const option = await Option.findOne({
    _id: id,
  });

  if (!option) throw new ErrorHandler(`Option not found with ID: ${id}`);

  await Promise.all([
    Option.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return option;
};
