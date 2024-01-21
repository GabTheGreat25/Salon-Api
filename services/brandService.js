const Brand = require("../models/brand");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");

exports.getAllBrandsData = async () => {
  const brands = await Brand.find()
    .sort({
      createdAt: -1,
    })
    .lean()
    .exec();

  return brands;
};

exports.getOneBrandData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid brand ID: ${id}`);

  const brand = await Brand.findById(id).lean().exec();

  if (!brand) throw new ErrorHandler(`Brand not found with ID ${id}`);

  return brand;
};

exports.createBrandData = async (req, res) => {
  const duplicateBrand = await Brand.findOne({
    brand_name: req.body.brand_name,
  })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateBrand) throw new ErrorHandler("Error Duplicate Brand");

  const brand = await Brand.create({
    ...req.body,
  });

  return brand;
};

exports.updateBrandData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid brand ID: ${id}`);

  const existingBrand = await Brand.findById(id).lean().exec();

  if (!existingBrand) throw new ErrorHandler(`Brand not found with ID: ${id}`);

  const duplicateBrand = await Brand.findOne({
    brand_name: req.body.brand_name,
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

    if(duplicateBrand) throw new ErrorHandler("Duplicate Brand");

  const updatedBrand = await Brand.findByIdAndUpdate(
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

  if (!updatedBrand) throw new ErrorHandler(`Brand not found with ID: ${id}`);

  return updatedBrand;
};

exports.deleteBrandData = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id))
      throw new ErrorHandler(`Invalid brand ID ${id}`);
  
    const brand = await Brand.findOne({
      _id: id,
    });
    if (!brand) throw new ErrorHandler(`Brand not found with ID: ${id}`);
    
    await Promise.all([
      Brand.deleteOne({
        _id: id,
      })
        .lean()
        .exec(),
    ]);
  
    return brand;
  };
  
