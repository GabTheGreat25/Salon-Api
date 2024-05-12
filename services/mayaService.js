const { v4: uuidv4 } = require("uuid");
const sdk = require("api")("@paymaya/v5.18#1bmd73pl9p4h9zf");
const { sendSMS } = require("../utils/twilio");
const { STATUSCODE } = require("../constants/index");

exports.createMayaCheckoutLink = async (req, res) => {
  const uuid = uuidv4();
  const formattedUuid = uuid
    .replace(/-/g, "")
    .slice(STATUSCODE.ZERO, STATUSCODE.THIRTY_TWO)
    .replace(/(\w{8})(\w{4})(\w{4})(\w{4})(\w{12})/, "$1-$2-$3-$4-$5");

  if (process.env.NODE_ENV === "development") {
    sdk.auth(
      process.env.PAYMAYA_SANDBOX_PUBLIC_KEY,
      process.env.PAYMAYA_SANDBOX_SECRET_KEY
    );
    sdk.server(
      process.env.PAYMAYA_SANDBOX_SERVER ||
        "https://pg-sandbox.paymaya.com/checkout/v1/checkouts"
    );
  } else {
    sdk.auth(process.env.PAYMAYA_PUBLIC_KEY, process.env.PAYMAYA_SECRET_KEY);
    sdk.server(process.env.PAYMAYA_SERVER || "https://pg.paymaya.com");
  }

  let subtotal = STATUSCODE.ZERO;

  if (req.body.items && req.body.items.length > STATUSCODE.ZERO) {
    subtotal = req.body.items.reduce(
      (acc, item) =>
        acc + (parseFloat(item.totalAmount.value) || STATUSCODE.ZERO),
      STATUSCODE.ZERO
    );
  }

  const discount = req.body.discount || STATUSCODE.ZERO;
  const totalAmountValue = (subtotal - parseFloat(discount)).toFixed(
    STATUSCODE.ZERO
  );

  const appointmentFee = req.body.items?.map((item) => item.totalAmount.value);
  const fee = appointmentFee * 0.3;
  const paymentFee = fee.toFixed(STATUSCODE.ZERO);

  const price =
    req.body.hasAppointmentFee === true ? paymentFee : totalAmountValue;

  const { data } = await sdk.createV1Checkout({
    totalAmount: {
      value: price,
      currency: process.env.CURRENCY || "PHP",
      ...(req.body.hasAppointmentFee === true
        ? {}
        : {
            details: {
              subtotal: subtotal,
              discount: discount,
            },
          }),
    },
    buyer: {
      contact: { phone: req.body.contactNumber },
      firstName: req.body.name,
    },
    redirectUrl: {
      success: "https://www.lhanlee-salon.com/",
      failure: "https://www.lhanlee-salon.com/",
      cancel: "https://www.lhanlee-salon.com/",
    },
    items:
      req.body.hasAppointmentFee === true
        ? [
            {
              name: "Service Appointment Fee",
              amount: { value: `${paymentFee}` },
              totalAmount: { value: `${paymentFee}` },
            },
          ]
        : req.body.items.map((item) => ({
            name: item.name || "Service",
            description: item.description || "Service Description",
            totalAmount: {
              value: item.totalAmount.value,
            },
          })),
    requestReferenceNumber: formattedUuid,
  });

  if (data) {
    const redirectUrl = data.redirectUrl;

    const smsMessage = `Dear ${req.body.name}, Here is your Maya checkout payment link: ${redirectUrl}`;

    console.log(smsMessage);
    sendSMS(
      `+63${req.body.contactNumber.substring(STATUSCODE.ONE)}`,
      smsMessage
    );
  } else console.log("No data returned from SDK");

  return data;
};
