const Product = require("../models/product");
const Delivery = require("../models/delivery");
const Service = require("../models/service");
const AddOns = require("../models/addOns");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE } = require("../constants/index");

exports.getAllProductData = async () => {
  const products = await Product.find()
    .sort({
      createdAt: -1,
    })
    .populate({ path: "brand", select: "brand_name" })
    .lean()
    .exec();

  return products;
};

exports.getSingleProductData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid product ID: ${id}`);

  const product = await Product.findById(id).lean().exec();

  if (!product) throw new ErrorHandler(`Product not found with ID: ${id}`);

  return product;
};

exports.createProductData = async (req, res) => {
  const duplicateProduct = await Product.findOne({
    product: req.body.product_name,
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateProduct) throw new ErrorHandler("Duplicate Product Name");

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

  const product = await Product.create({
    ...req.body,
    image: image,
  });

  return product;
};

exports.updateProductData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid product ID: ${id}`);

  const existingProduct = await Product.findById(id).lean().exec();

  if (!existingProduct)
    throw new ErrorHandler(`Product not found with ID: ${id}`);

  const duplicateProduct = await Product.findOne({
    product_name: { $regex: new RegExp(`^${req.body.product_name}$`, "i") },
    _id: {
      $ne: id,
    },
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  if (duplicateProduct) throw new ErrorHandler("Duplicate Product Name");

  let image = existingProduct.image || [];
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

    if (existingProduct.image && existingProduct.image.length > 0) {
      await cloudinary.api.delete_resources(
        existingProduct.image.map((image) => image.public_id)
      );
    }
  }
  const updatedProduct = await Product.findByIdAndUpdate(
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

  return updatedProduct;
};

exports.deleteProductData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid product ID ${id}`);

  const product = await Product.findOne({
    _id: id,
  });

  if (!product) throw new ErrorHandler(`Product not found with ID: ${id}`);

  const publicIds = product.image.map((image) => image.public_id);

  await Promise.all([
    Product.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
    Delivery.deleteMany({
      product: id,
    })
      .lean()
      .exec(),
    Service.deleteMany({
      product: id,
    })
      .lean()
      .exec(),
    AddOns.deleteMany({
      product: id,
    })
      .lean()
      .exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return product;
};
