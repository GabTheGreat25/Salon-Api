const { v4: uuidv4 } = require("uuid");
const sdk = require("api")("@paymaya/v5.18#1bmd73pl9p4h9zf");
const { sendSMS } = require("../utils/twilio");

exports.createMayaCheckoutLink = async (req, res) => {
  const uuid = uuidv4();
  const formattedUuid = uuid
    .replace(/-/g, "")
    .slice(0, 32)
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

  let subtotal = 0;

  if (req.body.items && req.body.items.length > 0) {
    subtotal = req.body.items.reduce(
      (acc, item) => acc + (parseFloat(item.totalAmount.value) || 0),
      0
    );
  }

  const discount = req.body.discount || 0;
  const totalAmountValue = (subtotal - parseFloat(discount)).toFixed(0);

  const price = req.body.hasAppointmentFee === true ? 150 : totalAmountValue;

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
      success: "https://lhanhlee-salon.vercel.app/",
      failure: "https://lhanhlee-salon.vercel.app/",
      cancel: "https://lhanhlee-salon.vercel.app/",
    },
    items:
      req.body.hasAppointmentFee === true
        ? [
            {
              name: "Service Appointment Fee",
              amount: { value: "150" },
              totalAmount: { value: "150" },
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

    const smsMessage = `Dear ${req.body.name}, Here is your Maya checkout link: ${redirectUrl}`;

    console.log(smsMessage);
    sendSMS(`+63${req.body.contactNumber.substring(1)}`, smsMessage);
  } else console.log("No data returned from SDK");

  return data;
};
