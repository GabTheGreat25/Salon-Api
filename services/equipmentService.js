const Equipment = require("../models/equipment");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllEquipmentData = async () => {
  const equipments = await Equipment.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .lean()
    .exec();

  return equipments;
};

exports.getSingleEquipmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid equipment ID: ${id}`);

  const equipment = await Equipment.findById(id).lean().exec();

  if (!equipment) throw new ErrorHandler(`Equipment not found with ID: ${id}`);

  return equipment;
};

exports.createEquipmentData = async (req, res) => {
  const duplicateEquipment = await Equipment.findOne({
    equipment_name: req.body.equipment_name,
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateEquipment) throw new ErrorHandler("Duplicate equipment");

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

  const equipment = await Equipment.create({
    ...req.body,
    image: image,
    available_quantity: req.body.quantity,
  });

  return equipment;
};

exports.updateEquipmentData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid equipment ID: ${id}`);

  const existingEquipment = await Equipment.findById(id).lean().exec();

  if (!existingEquipment)
    throw new ErrorHandler(`Equipment not found with ID: ${id}`);

  const duplicateEquipment = await Equipment.findOne({
    equipment_name: req.body.equipment_name,
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateEquipment) throw new ErrorHandler("Duplicate equipment");

  let image = existingEquipment.image || [];
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
      existingEquipment.image &&
      existingEquipment.image.length > STATUSCODE.ZERO
    ) {
      await cloudinary.api.delete_resources(
        existingEquipment.image.map((image) => image.public_id)
      );
    }
  }

  let updateData = { ...req.body, image: image };

  if (updateData.status === "Lost") {
    updateData.quantity = STATUSCODE.ZERO;
    updateData.isAvailable = false;
  }

  const updatedEquipment = await Equipment.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .lean()
    .exec();

  if (!updatedEquipment)
    throw new ErrorHandler(`Equipment not found with ID: ${id}`);

  return updatedEquipment;
};

exports.deleteEquipmentData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid equipment ID ${id}`);

  const equipment = await Equipment.findOne({
    _id: id,
  });
  if (!equipment) throw new ErrorHandler(`Equipment not found with ID: ${id}`);

  const publicIds = equipment.image.map((image) => image.public_id);

  await Promise.all([
    Equipment.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return equipment;
};
