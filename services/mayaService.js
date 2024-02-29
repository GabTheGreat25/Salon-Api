const { v4: uuidv4 } = require("uuid");
const sdk = require("api")("@paymaya/v5.18#1bmd73pl9p4h9zf");

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

  const discount = req.body.discount || "200";
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
    // redirectUrl: { //? Uncomment this line when deploying to production
    //   success: "https://salon-web.vercel.app",
    //    failure: "", //? Add failure and cancel redirect url
    //    cancel: "",
    // },
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
            quantity: item.quantity || 1,
            totalAmount: {
              value: item.totalAmount.value,
            },
          })),
    requestReferenceNumber: formattedUuid,
  });

  return data;
};
