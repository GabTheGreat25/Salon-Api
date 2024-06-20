const express = require("express");
const router = express.Router();
const chartController = require("../controllers/chartController");
const { verifyJWT, authorizeRoles } = require("../middleware/verifyJWT");
const { METHOD, PATH, ROLE } = require("../constants/index");

router.use(verifyJWT);

const chartRoutes = [
  {
    method: METHOD.GET,
    path: PATH.CHART_SERVICE_TYPE,
    roles: [ROLE.ADMIN],
    handler: chartController.getAllServiceTypes,
  },
  {
    method: METHOD.GET,
    path: PATH.CHART_CUSTOMER,
    roles: [ROLE.ADMIN],
    handler: chartController.getAppointmentCustomer,
  },
  {
    method: METHOD.GET,
    path: PATH.LOGBOOK_REPORT,
    roles: [ROLE.ADMIN],
    handler: chartController.getLogBookReport,
  },
  {
    method: METHOD.GET,
    path: PATH.EQUIPMENT_REPORT,
    roles: [ROLE.ADMIN],
    handler: chartController.equipmentReport,
  },
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENT_REPORT,
    roles: [ROLE.ADMIN],
    handler: chartController.getAppointmentReport,
  },
  {
    method: METHOD.GET,
    path: PATH.APPOINTMENT_SALE,
    roles: [ROLE.ADMIN],
    handler: chartController.getAppointmentSale,
  },
  {
    method: METHOD.GET,
    path: PATH.DELIVERY_TYPE,
    roles: [ROLE.ADMIN],
    handler: chartController.getDeliveryType,
  },
  {
    method: METHOD.GET,
    path: PATH.PRODUCT_TYPE,
    roles: [ROLE.ADMIN],
    handler: chartController.getProductType,
  },
  {
    method: METHOD.GET,
    path: PATH.SCHEDULE_TYPE,
    roles: [ROLE.ADMIN],
    handler: chartController.getScheduleCount,
  },
  {
    method: METHOD.GET,
    path: PATH.COMMENT_RATING,
    roles: [ROLE.ADMIN],
    handler: chartController.getCommentRating,
  },
  {
    method: METHOD.GET,
    path: PATH.TRANSACTION_METHOD,
    roles: [ROLE.ADMIN],
    handler: chartController.getPaymentMethod,
  },
  {
    method: METHOD.GET,
    path: PATH.FEEDBACK_COUNT,
    roles: [ROLE.ADMIN],
    handler: chartController.getFeedbackCount,
  },
  {
    method: METHOD.GET,
    path: PATH.BRAND_PRODUCT,
    roles: [ROLE.ADMIN],
    handler: chartController.getBrandProduct,
  },
  {
    method: METHOD.GET,
    path: PATH.ANONYMOUS_COMMENT,
    roles: [ROLE.ADMIN],
    handler: chartController.getAnonymousComment,
  },
  {
    method: METHOD.GET,
    path: PATH.ANONYMOUS_FEEDBACK,
    roles: [ROLE.ADMIN],
    handler: chartController.getAnonymousFeedback,
  },
  {
    method: METHOD.GET,
    path: PATH.RESERVATION_REPORT,
    roles: [ROLE.ADMIN],
    handler: chartController.getTransactionReservation,
  },
  {
    method: METHOD.GET,
    path: PATH.TRANSACTION_CUSTOMER_REPORT,
    roles: [ROLE.ADMIN],
    handler: chartController.getTransactionCustomerType,
  },
  {
    method: METHOD.GET,
    path: PATH.ALL_REPORTS,
    roles: [ROLE.ADMIN],
    handler: chartController.getAppointmentAllReports,  
  }
];

chartRoutes.forEach((route) => {
  const { method, path, roles, handler } = route;
  router[method](path, authorizeRoles(...roles), handler);
});

module.exports = router;
