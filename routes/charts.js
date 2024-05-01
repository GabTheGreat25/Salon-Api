const express = require("express");
const router = express.Router();
const { PATH, METHOD } = require("../constants/index");
const chartController = require("../controllers/chartController");

const chartRoutes = [
  {
    method: METHOD.GET,
    path: PATH.CHART_SERVICE_TYPE,
    handler: chartController.getAllServiceTypes,
  },
  {
    method: METHOD.GET,
    path: PATH.CHART_CUSTOMER,
    handler: chartController.getAppointmentCustomer,
  },
  {
    method: METHOD.GET,
    path: PATH.LOGBOOK_REPORT,
    handler: chartController.getLogBookReport,
  },
  {
    method: METHOD.GET,
    path: PATH.EQUIPMENT_REPORT,
    handler: chartController.equipmentReport,
  },
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENT_REPORT,
    handler: chartController.getAppointmentReport,
  },
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENT_SALE,
    handler: chartController.getAppointmentSale,
  },
  {
    method: METHOD.GET,
    path: PATH.DELIVERY_TYPE,
    handler: chartController.getDeliveryType,
  },
  {
    method: METHOD.GET,
    path: PATH.PRODUCT_TYPE,
    handler: chartController.getProductType,
  },
  {
    method: METHOD.GET,
    path: PATH.SCHEDULE_TYPE,
    handler: chartController.getScheduleCount,
  },
  {
    method: METHOD.GET,
    path: PATH.COMMENT_RATING,
    handler: chartController.getCommentRating,
  },
  {
    method: METHOD.GET,
    path: PATH.TRANSACTION_METHOD,
    handler: chartController.getPaymentMethod,
  },
  {
    method: METHOD.GET,
    path: PATH.FEEDBACK_COUNT,
    handler: chartController.getFeedbackCount,
  },
  {
    method: METHOD.GET,
    path: PATH.BRAND_PRODUCT,
    handler: chartController.getBrandProduct,
  },
  {
    method: METHOD.GET,
    path: PATH.ANONYMOUS_COMMENT,
    handler: chartController.getAnonymousComment,
  },
  {
    method: METHOD.GET,
    path: PATH.ANONYMOUS_FEEDBACK,
    handler: chartController.getAnonymousFeedback,
  },
  {
    method: METHOD.GET,
    path: PATH.RESERVATION_REPORT,
    handler: chartController.getTransactionReservation,
  },
  {
    method: METHOD.GET,
    path: PATH.TRANSACTION_CUSTOMER_REPORT,
    handler: chartController.getTransactionCustomerType,
  },
];

chartRoutes.forEach((route) => {
  const { method, path, handler } = route;
  router[method](path, handler);
});

module.exports = router;
