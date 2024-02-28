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

  const price = req.body.hasAppointmentFee === true ? 150 : req.body.price || 0;

  const { data } = await sdk.createV1Checkout({
    totalAmount: {
      value: price,
      currency: process.env.CURRENCY || "PHP",
    },
    requestReferenceNumber: formattedUuid,
  });

  return data;
};
