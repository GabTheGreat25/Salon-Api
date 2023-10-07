const Product = require("../models/product")
const ErrorHandler = require("../utils/errorHandler")
const mongoose = require("mongoose")

exports.getAllProductData = async()=>{

    const products = await Product.find().sort({ createdAt: -1 }).lean().exec()

    return products

}

exports.getSingleProductData = async(id)=>{

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ErrorHandler(`Invalid Product id: ${id}`)
    }

    const product = await Product.findById(id).lean().exec()

    if(!product){
        throw new ErrorHandler(`Product Id Not Found ${id}`)
    }

    return product
   
}

exports.createProductData = async(req, res)=>{

    const duplicateProduct = await Product.findOne({ product: req.body.product })
    .collation({ locale: "en" })
    .lean()
    .exec()

    if(duplicateProduct){
        throw new ErrorHandler("Error Duplicate Product")
    }

    const product = await Product.create(req.body)

    return product
    
}

exports.updateProductData = async(req, res, id)=>{

    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ErrorHandler(`Error Invalid Product ID ${id}`)
    }

    const updateproduct = await Product.findByIdAndUpdate(id, req.body, {
        new:true,
        runValidators:true
    })
    .lean()
    .exec()

    if(!updateproduct){
        throw new ErrorHandler(`Product with ID ${id} not found`)
    }

    const duplicateProductId = await Product.findOne({
        product_name: req.body.product_name,
        _id: { $ne: id },
    })

    .collation({ locale: "en" })
    .lean()
    .exec()

    if(duplicateProductId){
        throw new ErrorHandler("Duplicate Product")
    }

    return updateproduct
}

exports.deleteProductData = async(id)=>{
    if(!mongoose.Types.ObjectId.isValid(id)){
        throw new ErrorHandler(`Error Invalid Product ID ${id}`)
    }

    if(!id){
        return next(new ErrorHandler(`Error Product ID ${id} not Found`))
    }

    const deleteProduct = await Product.findByIdAndDelete({ _id: id }).lean().exec()

    return deleteProduct
    
}

