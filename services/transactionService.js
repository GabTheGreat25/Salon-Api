const Transaction = require("../models/transaction");
const Verification = require("../models/verification");
const Appointment = require("../models/appointment");
const Service = require("../models/service");
const Product = require("../models/product");
const User = require("../models/user");
const Inventory = require("../models/inventory");
const Comment = require("../models/comment");
const Information = require("../models/information");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { STATUSCODE, RESOURCE, ROLE } = require("../constants/index");
const QRCode = require("qrcode");
const { sendSMS } = require("../utils/twilio");

const generatePinkQRCode = async (data) => {
  const qrOptions = {
    color: {
      dark: "#000",
      light: "#FFB6C1",
    },
  };

  const qrCodeDataUrl = await QRCode.toDataURL(data, qrOptions);

  return qrCodeDataUrl;
};

exports.getAllTransactionData = async () => {
  const transactions = await Transaction.find()
    .sort({
      createdAt: STATUSCODE.NEGATIVE_ONE,
    })
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        {
          path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
          select: "name contact_number",
        },
        {
          path: RESOURCE.SERVICE,
          select: "_id service_name type occassion description price image",
          populate: {
            path: RESOURCE.PRODUCT,
            select: "product_name brand isNew image",
          },
        },
        {
          path: RESOURCE.OPTION,
          select: "option_name extraFee",
          populate: {
            path: RESOURCE.SERVICE,
            select: "_id service_name type occassion description price image",
          },
        },
      ],
      select: "_id date time price image hasAppointmentFee isRescheduled",
    })
    .lean()
    .exec();
  return transactions;
};

exports.getSingleTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findById(id)
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        {
          path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
          select: "name contact_number",
        },
        {
          path: RESOURCE.SERVICE,
          select: "_id service_name type occassion description price image",
          populate: {
            path: RESOURCE.PRODUCT,
            select: "product_name brand isNew image",
          },
        },
        {
          path: RESOURCE.OPTION,
          select: "option_name extraFee",
          populate: {
            path: RESOURCE.SERVICE,
            select: "_id service_name type occassion description price image",
          },
        },
      ],
      select: "_id date time price image hasAppointmentFee isRescheduled",
    })
    .lean()
    .exec();

  if (!transaction)
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  return transaction;
};

exports.updateTransactionData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const newStatus = req.body.status;
  const existingTransaction = await Transaction.findById(id)
    .populate({
      path: RESOURCE.APPOINTMENT,
      populate: [
        {
          path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
          select: "_id name contact_number",
        },
        {
          path: RESOURCE.SERVICE,
          select: "service_name type occassion description price image",
        },
        { path: RESOURCE.OPTION, select: "option_name extraFee" },
      ],
      select: "_id date time price image hasAppointmentFee",
    })
    .lean()
    .exec();

  if (!existingTransaction)
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  const wasCompleted = existingTransaction.status === "completed";
  const confirm = newStatus === "completed";

  const updatedTransaction = await Transaction.findOneAndUpdate(
    { _id: id },
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  ).exec();

  let updateVerification;

  if (wasCompleted && !confirm) {
    updateVerification = await Verification.findOneAndUpdate(
      { transaction: updatedTransaction?._id },
      { confirm: req.body.status !== "completed" },
      {
        new: true,
        runValidators: true,
      }
    );
  } else {
    updateVerification = await Verification.findOneAndUpdate(
      { transaction: updatedTransaction?._id },
      { confirm: confirm },
      {
        new: true,
        runValidators: true,
        upsert: true,
      }
    );
  }

  if (confirm) {
    const discountAmount =
      updatedTransaction.hasDiscount === true ? 0.2 : STATUSCODE.ZERO;

    let reserveFee = existingTransaction.appointment.price * 0.3;

    const appointmentFee =
      existingTransaction.appointment.hasAppointmentFee === true
        ? reserveFee
        : STATUSCODE.ZERO;

    const reserveCost = appointmentFee.toFixed(STATUSCODE.ZERO);

    const adjustedTotalPrice =
      existingTransaction.appointment.price -
      existingTransaction.appointment.price * discountAmount -
      reserveCost;

    let adjustedPriceWithoutDecimals = adjustedTotalPrice.toFixed(
      STATUSCODE.ZERO
    );

    await Appointment.findByIdAndUpdate(
      existingTransaction.appointment._id,
      { price: adjustedPriceWithoutDecimals },
      { new: true, runValidators: true }
    );

    const firstTime = existingTransaction.appointment.time[STATUSCODE.ZERO];
    let formattedTime;

    if (existingTransaction.appointment.time.length === STATUSCODE.ONE) {
      formattedTime = firstTime;
    } else {
      const lastTime =
        existingTransaction.appointment.time[
          existingTransaction.appointment.time.length - STATUSCODE.ONE
        ];
      formattedTime = `${firstTime} to ${lastTime}`;
    }

    const beauticianNames = existingTransaction.appointment.beautician.map(
      (b) => b.name
    );

    let discountedPrice = Number(existingTransaction.appointment.price * 0.2);

    const formattedReceipt =
      `========================================\n` +
      `         APPOINTMENT RECEIPT           \n` +
      `----------------------------------------\n` +
      ` Date: ${
        existingTransaction.appointment.date.toISOString().split("T")[
          STATUSCODE.ZERO
        ]
      }\n` +
      ` Time: ${formattedTime}\n` +
      `----------------------------------------\n` +
      `           Service Details              \n` +
      `----------------------------------------\n` +
      ` Service: ${
        existingTransaction.appointment.service.length > STATUSCODE.ONE
          ? existingTransaction.appointment.service
              .map((s) => s.service_name)
              .join(", ")
          : existingTransaction.appointment.service[STATUSCODE.ZERO]
              ?.service_name
      }\n` +
      `Add Ons: ${
        existingTransaction.appointment.option &&
        existingTransaction.appointment.option.length > 0
          ? existingTransaction.appointment.option
              .map((s) => s.option_name)
              .join(", ")
          : "None"
      }\n` +
      `----------------------------------------\n` +
      ` Beautician:\n` +
      `   Name: ${beauticianNames.join(", ")}\n` +
      `----------------------------------------\n` +
      `Payment: ${updatedTransaction.payment}\n` +
      `Appointment Price: ₱ ${existingTransaction?.appointment?.price}\n` +
      `Reservation Fee: -₱ ${Math.round(reserveCost)}\n` +
      `Discount: -₱ ${
        updatedTransaction.hasDiscount === true ? discountedPrice.toFixed(STATUSCODE.ZERO) : 0
      }\n` +
      `Service Total Fee: ₱ ${adjustedPriceWithoutDecimals}\n` +
      `----------------------------------------\n` +
      ` Thank you for choosing our services, ${existingTransaction.appointment.customer.name}!\n` +
      `----------------------------------------\n` +
      ` This receipt is an official proof of payment.\n` +
      ` Please keep it for your reference (Reference ID: ${existingTransaction._id})\n` +
      ` in case of any future inquiries or problems.\n` +
      `========================================`;

    updatedTransaction.qrCode = await generatePinkQRCode(formattedReceipt);

    const smsMessage =
      updatedTransaction.hasDiscount === true
        ? `Dear ${existingTransaction.appointment.customer.name} We are pleased to inform you that your transaction has been approved! You have received a 20% discount from Lhanlee Beauty Lounge, resulting in a discounted price of ₱ ${discountedPrice}. We sincerely thank you for choosing Lhanlee Salon, and we look forward to serving you again. We are pleased to inform you that your transaction has been approved! `
        : `Dear ${existingTransaction.appointment.customer.name}, your transaction has been approved! with an payment amount of ₱${adjustedPriceWithoutDecimals}  You can review your transaction details by checking your history. Thank you for choosing Lhanlee Salon.`;

    console.log(smsMessage);

    sendSMS(
      `+63${existingTransaction.appointment.customer.contact_number.substring(
        STATUSCODE.ONE
      )}`,
      smsMessage
    );

    setTimeout(async () => {
      const additionalSmsMessage = `Dear ${existingTransaction.appointment.customer.name}, it's been a while since your last visit. We miss you! Come and visit us again. Thank you for choosing Lhanlee Salon.`;

      console.log(additionalSmsMessage);

      sendSMS(
        `+63${existingTransaction.appointment.customer.contact_number.substring(
          STATUSCODE.ONE
        )}`,
        additionalSmsMessage
      );
    }, 20 * 24 * 60 * 60 * 1000);
    // }, 2 * 30 * 24 * 60 * 60 * 1000);
    updatedTransaction.reservationFee = reserveCost;
    await updatedTransaction.save();
  } else {
    updatedTransaction.qrCode = "";
    await updatedTransaction.save();
  }

  if (confirm) {
    const serviceIds = existingTransaction?.appointment?.service;

    const serviceCount = await Service.find({ _id: { $in: serviceIds } })
      .lean()
      .exec();

    if (serviceCount.length !== serviceIds.length) {
      throw new ErrorHandler(`No services were found`);
    }

    for (const serviceId of serviceCount) {
      const services = serviceId?._id;

      const service = await Service.findById(services)
        .populate({
          path: RESOURCE.PRODUCT,
          select:
            "_id product_name type remaining_volume product_consume product_volume quantity volume_description",
        })
        .collation({ locale: "en" })
        .lean()
        .exec();

      if (!service) {
        throw new ErrorHandler(`Service not found`);
      }

      for (const product of service.product) {
        const outStock = product.quantity === STATUSCODE.ZERO;

        if (outStock) {
          updatedTransaction.status = "pending";
          await updatedTransaction.save();
          throw new ErrorHandler(`${product.product_name} is out of stock`);
        } else {
          const userId = existingTransaction?.appointment?.customer?._id;
          const customer = await Information.findOne({ customer: userId })
            .collation({ locale: "en" })
            .lean()
            .exec();

          const description = customer?.description;
          let newVolume = product.remaining_volume - product.product_consume;
          let consumeSession = product?.product_consume;

          const isLongHair =
            description?.includes("Long Hair") &&
            service?.type?.includes("Hair") &&
            product?.type?.includes("Hair");

          if (isLongHair) {
            const long_vol = product.product_volume * 0.2;
            consumeSession = long_vol;
            newVolume = product.remaining_volume - long_vol;
          } else {
            newVolume - product.remaining_volume - consumeSession;
          }

          const productStock = await Product.findByIdAndUpdate(
            product._id,
            {
              remaining_volume: newVolume,
            },
            {
              new: true,
            }
          );

          let restock;
          let reducedQuantity = productStock.quantity;
          let emptyVolume = productStock.remaining_volume;
          let usedQty = STATUSCODE.ZERO;

          const isPieces = product?.volume_description?.includes("Pieces");
          if (isPieces) {
            productStock.remaining_volume - consumeSession;
            productStock.quantity = productStock.quantity - consumeSession;
            usedQty = consumeSession;
            reducedQuantity = productStock.quantity - consumeSession;
          }

          const isEmpty = emptyVolume == STATUSCODE.ZERO;
          if (isEmpty) {
            restock = productStock.remaining_volume =
              productStock.product_volume;
            reducedQuantity = productStock.quantity - STATUSCODE.ONE;
            usedQty = STATUSCODE.ONE;
          }

          const isLeft = consumeSession > newVolume;
          if (isLeft) {
            restock = productStock.remaining_volume =
              productStock.product_volume;
            reducedQuantity = productStock.quantity - STATUSCODE.ONE;
            usedQty = STATUSCODE.ONE;
            const leftVolume = consumeSession * 0.5;
            newVolume = productStock.current_volume - leftVolume;
          }

          const isMeasured =
            productStock.current_volume < STATUSCODE.ONE_THOUSAND;
          if (isMeasured) {
            productStock.measurement = "ml";
          } else {
            productStock.measurement = "Liter";
          }

          const isLow = productStock.quantity === STATUSCODE.TEN;

          if (isLow) {
            const getAdminUsers = async () => {
              const admins = await User.find({ roles: ROLE.ADMIN });

              return admins;
            };

            const admins = await getAdminUsers();
            const adminNumbers = admins.map((admin) => admin.contact_number);

            const smsAdminMessage = `Product ${productStock?.product_name} has ${productStock?.quantity} quantity left`;
            adminNumbers.forEach((number, index) => {
              console.log(smsAdminMessage);
              sendSMS(
                `+63${number.substring(STATUSCODE.ONE)}`,
                smsAdminMessage
              );
            });
          }

          await productStock.save();

          await Inventory.create({
            transaction: existingTransaction?._id,
            appointment: existingTransaction?.appointment?._id,
            service: service?._id,
            product: product?._id,
            product_consume: consumeSession,
            old_volume: product.remaining_volume,
            remained_volume: emptyVolume,
            old_quantity: isPieces
              ? product.remaining_volume
              : productStock.quantity,
            remained_quantity: isPieces
              ? productStock.quantity
              : reducedQuantity,
            deducted_quantity: usedQty,
          });
        }
      }
    }
  }

  return { existingTransaction, updatedTransaction, updateVerification };
};

exports.deleteTransactionData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid transaction ID: ${id}`);

  const transaction = await Transaction.findOne({
    _id: id,
  });

  if (!transaction)
    throw new ErrorHandler(`Transaction not found with ID: ${id}`);

  await Promise.all([
    Transaction.deleteOne({
      _id: id,
    })
      .populate({
        path: RESOURCE.APPOINTMENT,
        populate: {
          path: `${RESOURCE.BEAUTICIAN} ${RESOURCE.CUSTOMER}`,
          select: "name contact_number",
        },
        populate: {
          path: RESOURCE.SERVICE,
          select: "service_name type occassion description price image",
        },
        populate: {
          path: RESOURCE.OPTION,
          select: "option_name extraFee",
        },
        select: "date time price image hasAppointmentFee",
      })
      .lean()
      .exec(),
    Appointment.deleteOne({ _id: transaction.appointment }).lean().exec(),
    Verification.deleteMany({ transaction: id }).lean().exec(),
    Comment.deleteMany({ transaction: id }).lean().exec(),
  ]);

  return transaction;
};
