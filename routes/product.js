const express = require("express")
const router = express.Router()

const productController = require("../controllers/productController")
const {METHOD, PATH } = require("../constants/index")

const productRoutes = [

    {
        method: METHOD.GET,
        path: PATH.PRODUCTS,
        handler:productController.getAllProducts
    },

    {
        method: METHOD.GET,
        path: PATH.PRODUCT_ID,
        handler: productController.getSingleProduct
    },

    {
        method: METHOD.POST,
        path: PATH.PRODUCT_STORE,
        handler: productController.createProduct
    },

    {
        method: METHOD.PUT,
        path: PATH.EDIT_PRODUCT_ID,
        handler: productController.updateProduct
    },

    {
        method: METHOD.DELETE,
        path: PATH.DELETE_PRODUCT_ID,
        handler: productController.deleteProduct
    
    }
]

productRoutes.forEach((route)=>{

    const { method, path, handler } = route
    router[method](path, handler)

})

module.exports = router