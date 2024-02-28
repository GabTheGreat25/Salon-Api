const SuccessHandler = require("../utils/successHandler");
const mayaService = require("../services/mayaService");
const asyncHandler = require("express-async-handler");

exports.createNewMayaCheckout = [
  asyncHandler(async (req, res, next) => {
    const data = await mayaService.createMayaCheckoutLink(req);
    const { checkoutId, redirectUrl } = data || {};

    return SuccessHandler(
      res,
      `Successfully created a new Maya checkout link.`,
      { checkoutId, redirectUrl }
    );
  }),
];
