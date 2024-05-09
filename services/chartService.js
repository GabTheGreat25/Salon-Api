const Appointment = require("../models/appointment");
const LogBook = require("../models/logbook");
const Equipment = require("../models/equipment");
const Transaction = require("../models/transaction");
const Delivery = require("../models/delivery");
const Product = require("../models/product");
const Schedule = require("../models/schedule");
const Comment = require("../models/comment");
const Feedback = require("../models/feedback");
const { RESOURCE } = require("../constants/index");
const moment = require("moment");

exports.getAllServiceTypesData = async () => {
  // const startDate = moment().startOf("week").toDate();
  // const endDate = moment().endOf("week").toDate();

  // const serviceCounts = await Appointment.aggregate([
  //   {
  //     $lookup: {
  //       from: "services",
  //       localField: "service",
  //       foreignField: "_id",
  //       as: "serviceDetails",
  //     },
  //   },
  //   {
  //     $unwind: "$serviceDetails",
  //   },
  //   {
  //     $match: {
  //       "serviceDetails.type": {
  //         $in: ["Hands", "Hair", "Feet", "Facial", "Body", "Eyelash"],
  //       },
  //       date: { $gte: startDate, $lte: endDate },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //       serviceType: { $first: "$serviceDetails.type" },
  //       count: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $sort: { _id: 1 },
  //   },
  // ]).exec();

  // return serviceCounts;

  const serviceCounts = await Appointment.aggregate([
    {
      $lookup: {
        from: "services",
        localField: "service",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $unwind: "$serviceDetails",
    },
    {
      $match: {
        "serviceDetails.type": {
          $in: ["Hands", "Hair", "Feet", "Facial", "Body", "Eyelash"],
        },
      },
    },
    {
      $group: {
        _id: "$serviceDetails.type",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]).exec();

  return serviceCounts;
};

exports.getAppointmentCustomerData = async () => {
  // const startDate = moment().startOf("week").toDate();
  // const endDate = moment().endOf("week").toDate();

  // const customerCounts = await Appointment.aggregate([
  //   {
  //     $lookup: {
  //       from: "information",
  //       localField: "customer",
  //       foreignField: "_id",
  //       as: "customerDetails",
  //     },
  //   },
  //   {
  //     $unwind: "$customerDetails",
  //   },
  //   {
  //     $match: {
  //       "customerDetails.description": { $in: ["Male", "Female"] },
  //       date: { $gte: startDate, $lte: endDate },
  //     },
  //   },
  //   {
  //     $group: {
  //       _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
  //       gender: { $first: "$customerDetails.description" },
  //       count: { $sum: 1 },
  //     },
  //   },
  //   {
  //     $sort: { _id: 1 },
  //   },
  // ]);

  // return customerCounts;

  const customerCounts = await Appointment.aggregate([
    {
      $lookup: {
        from: RESOURCE.INFORMATION,
        localField: "customer",
        foreignField: "customer",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $project: {
        _id: 0,
        customer: "$customer",
        description: "$customerDetails.description",
      },
    },
    {
      $group: {
        _id: "$description",
        count: { $sum: 1 },
      },
    },
  ]);

  return customerCounts;
};

exports.logBookData = async () => {
  // const logbook = await LogBook.aggregate([
  //   {
  //     $match: {
  //       status: {
  //         $in: [
  //           "Borrowed",
  //           "Returned",
  //           "Returned With Missing",
  //           "Returned With Damage",
  //           "Returned Damage & Missing",
  //         ],
  //       },
  //     },
  //   },
  //   {
  //     $unwind: "$equipment",
  //   },
  //   {
  //     $group: {
  //       _id: null,
  //       totalBorrowed: {
  //         $sum: {
  //           $cond: [
  //             { $eq: ["$status", "Borrowed"] },
  //             "$equipment.borrow_quantity",
  //             0,
  //           ],
  //         },
  //       },
  //       totalReturned: {
  //         $sum: {
  //           $cond: [
  //             { $eq: ["$status", "Returned"] },
  //             "$equipment.borrow_quantity",
  //             0,
  //           ],
  //         },
  //       },
  //       totalReturnedWithMissing: {
  //         $sum: {
  //           $cond: [
  //             { $eq: ["$status", "Returned With Missing"] },
  //             "$equipment.borrow_quantity",
  //             0,
  //           ],
  //         },
  //       },
  //       totalReturnedWithDamage: {
  //         $sum: {
  //           $cond: [
  //             { $eq: ["$status", "Returned With Damage"] },
  //             "$equipment.borrow_quantity",
  //             0,
  //           ],
  //         },
  //       },
  //       totalReturnedDamageMissing: {
  //         $sum: {
  //           $cond: [
  //             { $eq: ["$status", "Returned Damage & Missing"] },
  //             "$equipment.borrow_quantity",
  //             0,
  //           ],
  //         },
  //       },
  //     },
  //   },
  // ]);

  const logbook = await LogBook.aggregate([
    {
      $match: {
        status: {
          $in: [
            "Borrowed",
            "Returned",
            "Returned With Missing",
            "Returned With Damage",
            "Returned Damage & Missing",
          ],
        },
      },
    },
    {
      $unwind: "$equipment",
    },
    {
      $group: {
        _id: "$status",
        totalBorrowed: {
          $sum: {
            $cond: [{ $eq: ["$status", "Borrowed"] }, "$equipment.borrow_quantity", 0],
          },
        },
        totalReturned: {
          $sum: {
            $cond: [{ $eq: ["$status", "Returned"] }, "$equipment.borrow_quantity", 0],
          },
        },
        totalReturnedWithMissing: {
          $sum: {
            $cond: [
              { $eq: ["$status", "Returned With Missing"] },
              "$equipment.borrow_quantity",
              0,
            ],
          },
        },
        totalReturnedWithDamage: {
          $sum: {
            $cond: [
              { $eq: ["$status", "Returned With Damage"] },
              "$equipment.borrow_quantity",
              0,
            ],
          },
        },
        totalReturnedDamageMissing: {
          $sum: {
            $cond: [
              { $eq: ["$status", "Returned Damage & Missing"] },
              "$equipment.borrow_quantity",
              0,
            ],
          },
        },
        equipmentNames: {
          $push: "$equipment.equipment_name", 
        },
      },
    },
  ]);
  return logbook;
};

exports.equipmentReportData = async () => {
  const equipment = await Equipment.aggregate([
    {
      $group: {
        _id: null,
        totalMissing: { $sum: "$missing_qty" },
        totalDamage: { $sum: "$damage_qty" },
        totalBorrowed: { $sum: "$borrow_qty" },
      },
    },
    {
      $project: {
        _id: 0,
        totalMissing: 1,
        totalDamage: 1,
        totalBorrowed: 1,
      },
    },
  ]);

  return equipment;
};

exports.getAppointmentReportData = async () => {
  const status = await Transaction.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return status;
};

exports.getAppointmentSaleData = async () => {
  const totalAppointmentPrice = await Appointment.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$price" },
      },
    },
  ]);

  return totalAppointmentPrice;
};

exports.getDeliveryTypeData = async () => {
  const productTypeStatusCounts = await Delivery.aggregate([
    {
      $unwind: "$type",
    },
    {
      $group: {
        _id: {
          type: "$type",
          status: "$status",
          date: "$date",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  return productTypeStatusCounts;
};

exports.getProductCountData = async () => {
  const productCounts = await Product.aggregate([
    {
      $unwind: "$type",
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
  ]);

  return productCounts;
};

exports.getScheduleCountsData = async () => {
  const scheduleCounts = await Schedule.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  return scheduleCounts;
};

exports.getRatingCountsData = async () => {
  const ratingCounts = await Comment.aggregate([
    {
      $group: {
        _id: "$ratings",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return ratingCounts;
};

exports.getPaymentMethodCountData = async () => {
  const paymentCounts = await Transaction.aggregate([
    {
      $match: {
        payment: { $in: ["Cash", "Maya"] },
      },
    },
    {
      $group: {
        _id: "$payment",
        count: { $sum: 1 },
      },
    },
  ]);

  return paymentCounts;
};

exports.getFeedbackCountData = async () => {
  const feedbackCount = await Feedback.aggregate([
    {
      $count: "totalFeedbacks",
    },
  ]);

  return feedbackCount;
};

exports.getBrandProductData = async () => {
  const brands = await Product.aggregate([
    {
      $group: {
        _id: "$brand",
        productCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "_id",
        foreignField: "_id",
        as: "brandDetails",
      },
    },
    {
      $unwind: "$brandDetails",
    },
    {
      $project: {
        _id: 0,
        brandName: "$brandDetails.brand_name",
        productCount: 1,
      },
    },
  ]);

  return brands;
};

exports.getAnonymousCommentData = async () => {
  const commentCounts = await Comment.aggregate([
    {
      $group: {
        _id: "$isAnonymous",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        isAnonymous: "$_id",
        count: 1,
      },
    },
  ]);

  return commentCounts;
};

exports.getReservationReportData = async () => {
  const totalReservation = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$reservationFee" },
      },
    },
  ]);

  return totalReservation;
};

exports.transactionCustomerTypeData = async () => {
  const customer = await Transaction.aggregate([
    {
      $match: {
        customer_type: { $in: ["Customer", "Pwd", "Senior"] },
      },
    },
    {
      $group: {
        _id: "$customer_type",
        count: { $sum: 1 },
      },
    },
  ]);

  return customer;
};
