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
const { STATUSCODE, RESOURCE } = require("../constants/index");
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
        { path: "beautician customer", select: "name contact_number" },
        {
          path: "service",
          select: "_id service_name type occassion description price image",
          populate: {
            path: "product",
            select: "product_name brand isNew image",
          },
        },
        {
          path: "option",
          select: "option_name extraFee",
          populate: {
            path: "service",
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
        { path: "beautician customer", select: "name contact_number" },
        {
          path: "service",
          select: "_id service_name type occassion description price image",
          populate: {
            path: "product",
            select: "product_name brand isNew image",
          },
        },
        {
          path: "option",
          select: "option_name extraFee",
          populate: {
            path: "service",
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
      path: "appointment",
      populate: [
        { path: "beautician customer", select: "_id name contact_number" },
        {
          path: "service",
          select: "service_name type occassion description price image",
        },
        { path: "option", select: "option_name extraFee" },
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
    const discountAmount = updatedTransaction.hasDiscount === true ? 0.2 : 0;

    let reserveFee = existingTransaction.appointment.price * 0.3;

    const appointmentFee =
      existingTransaction.appointment.hasAppointmentFee === true
        ? reserveFee
        : 0;

    const reserveCost = appointmentFee.toFixed(0);

    const adjustedTotalPrice =
      existingTransaction.appointment.price -
      existingTransaction.appointment.price * discountAmount -
      reserveCost;

    let adjustedPriceWithoutDecimals = adjustedTotalPrice.toFixed(0);

    await Appointment.findByIdAndUpdate(
      existingTransaction.appointment._id,
      { price: adjustedPriceWithoutDecimals },
      { new: true, runValidators: true }
    );

    const firstTime = existingTransaction.appointment.time[0];
    let formattedTime;

    if (existingTransaction.appointment.time.length === 1) {
      formattedTime = firstTime;
    } else {
      const lastTime =
        existingTransaction.appointment.time[
          existingTransaction.appointment.time.length - 1
        ];
      formattedTime = `${firstTime} to ${lastTime}`;
    }

    const beauticianNames = existingTransaction.appointment.beautician.map(
      (b) => b.name
    );

    let grandTotalFee = Number(adjustedPriceWithoutDecimals) + reserveCost;

    const formattedReceipt =
      `========================================\n` +
      `         APPOINTMENT RECEIPT           \n` +
      `----------------------------------------\n` +
      ` Date: ${
        existingTransaction.appointment.date.toISOString().split("T")[0]
      }\n` +
      ` Time: ${formattedTime}\n` +
      `----------------------------------------\n` +
      `           Service Details              \n` +
      `----------------------------------------\n` +
      ` Service: ${
        existingTransaction.appointment.service.length > 1
          ? existingTransaction.appointment.service
              .map((s) => s.service_name)
              .join(", ")
          : existingTransaction.appointment.service[0]?.service_name
      }\n` +
      ` Add Ons: ${
        existingTransaction.appointment.option
          ? existingTransaction.appointment.option.length > 1
            ? existingTransaction.appointment.option
                .map((s) => s.option_name)
                .join(", ")
            : existingTransaction.appointment.option[0]?.option_name
          : "None"
      }\n` +
      `----------------------------------------\n` +
      ` Beautician:\n` +
      `   Name: ${beauticianNames.join(", ")}\n` +
      `----------------------------------------\n` +
      `Payment: ${updatedTransaction.payment}\n` +
      `Service Total Fee: ₱ ${adjustedPriceWithoutDecimals}\n` +
      `Reservation Fee: ₱ ${Math.round(reserveCost)}\n` +
      `Total Amount Fee: ₱ ${grandTotalFee}\n` +
      `----------------------------------------\n` +
      ` Thank you for choosing our services, ${existingTransaction.appointment.customer.name}!\n` +
      `----------------------------------------\n` +
      ` This receipt is an official proof of payment.\n` +
      ` Please keep it for your reference (Reference ID: ${existingTransaction._id})\n` +
      ` in case of any future inquiries or problems.\n` +
      `========================================`;

    updatedTransaction.qrCode = await generatePinkQRCode(formattedReceipt);

    const smsMessage = updatedTransaction.hasDiscount
      ? `Dear ${existingTransaction.appointment.customer.name}, your transaction has been approved! You received a 20% discount. Thank you for choosing Lhanlee Salon.`
      : `Dear ${existingTransaction.appointment.customer.name}, your transaction has been approved! You can review your transaction details by checking your history. Thank you for choosing Lhanlee Salon.`;

    console.log(smsMessage);

    sendSMS(
      `+63${existingTransaction.appointment.customer.contact_number.substring(
        1
      )}`,
      smsMessage
    );

    setTimeout(async () => {
      const additionalSmsMessage = `Dear ${existingTransaction.appointment.customer.name}, it's been a while since your last visit. We miss you! Come and visit us again. Thank you for choosing Lhanlee Salon.`;

      console.log(additionalSmsMessage);

      sendSMS(
        `+63${existingTransaction.appointment.customer.contact_number.substring(
          1
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
    try {
      const serviceIds = existingTransaction?.appointment?.service;

      const serviceCount = await Service.find({ _id: { $in: serviceIds } })
        .lean()
        .exec();

      if (serviceCount.length !== serviceIds.length) {
        throw new ErrorHandler(`No services were found`);
      }

      for (const serviceId of serviceCount) {
        0;
        const services = serviceId?._id;

        const service = await Service.findById(services)
          .populate({
            path: "product",
            select:
              "_id product_name type remaining_volume product_consume product_volume quantity",
          })
          .collation({ locale: "en" })
          .lean()
          .exec();

        if (!service) {
          throw new ErrorHandler(`Service not found`);
        }

        for (const product of service.product) {
          const outStock = product.quantity === 0;
          if (outStock) {
            updatedTransaction.status = "pending";
            await updatedTransaction.save();
            throw new ErrorHandler(`${product.product_name} is out of stock`);
          }
           else 
           {
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
            let usedQty = 0;

            const isEmpty = emptyVolume == 0;
            if (isEmpty) {
              restock = productStock.remaining_volume =
                productStock.product_volume;
              reducedQuantity = productStock.quantity - 1;
              usedQty = 1;
            }

            const isLeft = consumeSession > newVolume;
            if (isLeft) {
              restock = productStock.remaining_volume =
                productStock.product_volume;
              reducedQuantity = productStock.quantity - 1;
              usedQty = 1;
              const leftVolume = consumeSession * 0.5;
              newVolume = productStock.current_volume - leftVolume;
            }

            const isMeasured = productStock.current_volume < 1000;
            if (isMeasured) {
              productStock.measurement = "ml";
            } else {
              productStock.measurement = "Liter";
            }

            await productStock.save();

            const inventory = await Inventory.create({
              transaction: existingTransaction?._id,
              appointment: existingTransaction?.appointment?._id,
              service: service?._id,
              product: product?._id,
              product_consume: consumeSession,
              old_volume: product.remaining_volume,
              remained_volume: emptyVolume,
              old_quantity: productStock.quantity,
              remained_quantity: reducedQuantity,
              deducted_quantity: usedQty,
            });
          }
        } // end product loop
      }
    } catch (err) {
      throw new ErrorHandler(err);
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
          path: "beautician customer",
          select: "name contact_number",
        },
        populate: {
          path: "service",
          select: "service_name type occassion description price image",
        },
        populate: {
          path: "option",
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
