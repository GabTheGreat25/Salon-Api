const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliveryController");
const { METHOD, PATH } = require("../constants/index");

const deliveryRoutes = [
    {
        method:METHOD.GET,
        path: PATH.DELIVERY,
        handler: deliveryController.getAllDelivery
    },
    {
        method:METHOD.GET,
        path: PATH.DELIVERY_ID,
        handler: deliveryController.getSingleDelivery
    },
    {
        method:METHOD.POST,
        path: PATH.DELIVERY,
        handler: deliveryController.createDelivery
    },
    {
        method:METHOD.PATCH,
        path: PATH.EDIT_DELIVERY_ID,
        handler: deliveryController.updateDelivery
    },
    {
        method: METHOD.DELETE,
        path: PATH.DELIVERY_ID,
        handler: deliveryController.deleteDelivery
    }
];

deliveryRoutes.forEach((route)=>{
    const {method, path, handler} = route;
    router[method](path, handler);
});

module.exports = router;