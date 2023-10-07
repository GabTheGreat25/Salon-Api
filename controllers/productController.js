const productServices = require("../services/productServices")
const ErrorHandler = require("../utils/errorHandler")
const SuccessHandler = require("../utils/successHandler")
const checkRequiredFields = require("../helpers/checkRequiredFields")
const asyncHandler = require("express-async-handler")

exports.getAllProducts = asyncHandler(async(req, res, next)=>{

    const products = await productServices.getAllProductData()

    return !products?.length
    ? next(new ErrorHandler("No products Found..."))

    :SuccessHandler(res, `Products with product ${products.map((u)=> u.product).join(", ")} and IDs
     ${products.map((u)=> u._id).join(", ")} retrieved`, products)

})

exports.getSingleProduct = asyncHandler(async(req, res, next)=>{

    const product = await productServices.getSingleProductData(req.params?.id)

    return !product ?
    next(new ErrorHandler("Error No Product Found"))
    : SuccessHandler(res, `Product ${product?.product} with product id ${product?._id} retrieved`, product)
    
})

exports.createProduct = [

    // checkRequiredFields(["product"]),
    
    asyncHandler(async(req, res)=>{

        const product = await productServices.createProductData(req)

        return SuccessHandler(res, `Created new Product ${product?.product_name} with product id ${product?._id}`, product)

    })
]

exports.updateProduct = [

    // checkRequiredFields(["product"]),
    
    asyncHandler(async(req, res, next)=>{


        const product = await productServices.updateProductData(req, res, req.params.id)

        return SuccessHandler(res, `Product ${product?.product_name} with product id ${product?._id} successfully updated`, product)
    })
]

exports.deleteProduct = asyncHandler(async(req, res, next)=>{

    const product = await productServices.deleteProductData(req.params.id)

    return !product ?
    next(new ErrorHandler("Error Product Not Found"))
    : SuccessHandler(res, `Product ${product?.product_name} with product id ${product?._id} deleted successfully`, product)
})