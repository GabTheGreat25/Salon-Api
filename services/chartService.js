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
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

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
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "beautician",
        foreignField: "_id",
        as: "beauticianDetails",
      },
    },
    {
      $unwind: "$beauticianDetails",
    },
    {
      $group: {
        _id: "$serviceDetails.type",
        appointmentCount: { $sum: 1 },
        customers: {
          $addToSet: {
            id: "$customerDetails._id",
            name: "$customerDetails.name",
            beautician: "$beauticianDetails.name",
            date: "$date",
            service_name: "$serviceDetails.service_name",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  return serviceCounts;
};

exports.getAppointmentCustomerData = async () => {
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const customerCounts = await Appointment.aggregate([
    {
      $lookup: {
        from: "information",
        localField: "customer",
        foreignField: "customer",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
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
      $lookup: {
        from: "users",
        localField: "beautician",
        foreignField: "_id",
        as: "beauticianDetails",
      },
    },
    {
      $unwind: "$beauticianDetails",
    },
    {
      $project: {
        _id: 0,
        customer: "$customer",
        name: "$userDetails.name",
        beautician: "$beauticianDetails.name",
        description: "$customerDetails.description",
        appointmentDate: "$date",
        appointmentTime: "$time",
        serviceName: "$serviceDetails.service_name",
      },
    },
    {
      $group: {
        _id: "$description",
        customers: {
          $push: {
            name: "$name",
            beautician: "$beautician",
            description: "$description",
            appointmentDate: "$appointmentDate",
            appointmentTime: "$appointmentTime",
            serviceName: "$serviceName",
          },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        description: "$_id",
        _id: 0,
        customers: 1,
        count: 1,
      },
    },
  ]).exec();

  return customerCounts;
};

exports.logBookData = async () => {
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
      $lookup: {
        from: "equipment",
        localField: "equipment.equipment",
        foreignField: "_id",
        as: "equipmentDetails",
      },
    },
    {
      $unwind: "$equipmentDetails",
    },
    {
      $group: {
        _id: "$status",
        totalBorrowed: {
          $sum: {
            $cond: [
              { $eq: ["$status", "Borrowed"] },
              "$equipment.borrow_quantity",
              0,
            ],
          },
        },
        totalReturned: {
          $sum: {
            $cond: [
              { $eq: ["$status", "Returned"] },
              "$equipment.borrow_quantity",
              0,
            ],
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
          $push: "$equipmentDetails.equipment_name",
        },
        datesBorrowed: {
          $push: "$date_borrowed",
        },
        datesReturned: {
          $push: "$date_returned",
        },
      },
    },
  ]);

  return logbook;
};

exports.equipmentReportData = async () => {
  const equipment = await Equipment.aggregate([
    {
      $match: {
        $or: [
          { missing_qty: { $gt: 0 } },
          { damage_qty: { $gt: 0 } },
          { borrow_qty: { $gt: 0 } },
        ],
      },
    },
    {
      $group: {
        _id: "$equipment_name",
        totalMissing: { $sum: "$missing_qty" },
        totalDamage: { $sum: "$damage_qty" },
        totalBorrowed: { $sum: "$borrow_qty" },
      },
    },
    {
      $project: {
        _id: 0,
        equipmentName: "$_id",
        totalMissing: 1,
        totalDamage: 1,
        totalBorrowed: 1,
      },
    },
  ]);

  return equipment;
};

exports.getAppointmentReportStatusData = async () => {
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const status = await Transaction.aggregate([
    {
      $lookup: {
        from: "appointments",
        localField: "appointment",
        foreignField: "_id",
        as: "appointmentDetails",
      },
    },
    {
      $unwind: "$appointmentDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "appointmentDetails.customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "appointmentDetails.beautician",
        foreignField: "_id",
        as: "beauticianDetails",
      },
    },
    {
      $unwind: "$beauticianDetails",
    },
    {
      $lookup: {
        from: "services",
        localField: "appointmentDetails.service",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $unwind: "$serviceDetails",
    },
    // {
    //   $match: {
    //     "appointmentDetails.date": { $gte: startDate, $lte: endDate },
    //   },
    // },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        appointments: {
          $push: {
            date: "$appointmentDetails.date",
            time: "$appointmentDetails.time",
            customerName: "$customerDetails.name",
            beautician: "$beauticianDetails.name",
            status: "$appointmentDetails.status",
            serviceName: "$serviceDetails.service_name",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $group: {
        _id: null,
        statuses: {
          $push: {
            status: "$_id",
            count: "$count",
            appointments: "$appointments",
          },
        },
        totalCounts: {
          $sum: "$count",
        },
        completed: {
          $sum: {
            $cond: [{ $eq: ["$_id", "completed"] }, "$count", 0],
          },
        },
        cancelled: {
          $sum: {
            $cond: [{ $eq: ["$_id", "cancelled"] }, "$count", 0],
          },
        },
        pending: {
          $sum: {
            $cond: [{ $eq: ["$_id", "pending"] }, "$count", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        statuses: 1,
        totalCounts: 1,
        completed: 1,
        cancelled: 1,
        pending: 1,
      },
    },
  ]);

  return status;
};

exports.getAppointmentSaleData = async () => {
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const completedAppointments = await Appointment.aggregate([
    // {
    //   $match: {
    //     date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    //   },
    // },
    {
      $lookup: {
        from: "transactions",
        localField: "_id",
        foreignField: "appointment",
        as: "transactions",
      },
    },
    {
      $unwind: "$transactions",
    },
    {
      $match: {
        "transactions.status": "completed",
      },
    },
    {
      $lookup: {
        from: "services",
        localField: "service",
        foreignField: "_id",
        as: "services",
      },
    },
    {
      $unwind: "$services",
    },
    {
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "beautician",
        foreignField: "_id",
        as: "beauticianDetails",
      },
    },
    {
      $unwind: "$beauticianDetails",
    },
    {
      $project: {
        date: 1,
        time: 1,
        price: 1,
        "services.service_name": 1,
        "customerDetails.name": 1,
        "transactions.payment": 1,
        "beauticianDetails.name": 1,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$price" },
        appointments: {
          $push: {
            date: "$date",
            time: "$time",
            price: "$price",
            service: "$services.service_name",
            customer: "$customerDetails.name",
            paymentMethod: "$transactions.payment",
            beautician: "$beauticianDetails.name",
          },
        },
      },
    },
  ]);

  return completedAppointments.length > 0
    ? completedAppointments[0]
    : { total: 0, appointments: [] };
};

exports.getDeliveryTypeData = async () => {
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const delivery = await Delivery.aggregate([
    // {
    //   $match: {
    //     date: { $gte: startDate, $lte: endDate },
    //   },
    // },
    {
      $unwind: "$type",
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $group: {
        _id: {
          type: "$type",
          status: "$status",
          date: "$date",
          payment: "$payment",
          product_name: "$productDetails.product_name",
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        type: "$_id.type",
        status: "$_id.status",
        date: "$_id.date",
        payment: "$_id.payment",
        product: "$_id.product_name",
        count: "$count",
      },
    },
  ]);

  return delivery;
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
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const scheduleCounts = await Schedule.aggregate([
    // {
    //   $match: {
    //     date: { $gte: startDate, $lte: endDate },
    //   },
    // },
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
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const paymentCounts = await Transaction.aggregate([
    {
      $lookup: {
        from: "appointments",
        localField: "appointment",
        foreignField: "_id",
        as: "appointmentDetails",
      },
    },
    {
      $unwind: "$appointmentDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "appointmentDetails.customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "appointmentDetails.beautician",
        foreignField: "_id",
        as: "beauticianDetails",
      },
    },
    {
      $unwind: "$beauticianDetails",
    },
    {
      $lookup: {
        from: "services",
        localField: "appointmentDetails.service",
        foreignField: "_id",
        as: "serviceDetails",
      },
    },
    {
      $unwind: "$serviceDetails",
    },
    {
      $match: {
        // "appointmentDetails.date": { $gte: startDate, $lte: endDate },
        payment: { $in: ["Cash", "Maya"] },
      },
    },
    {
      $group: {
        _id: "$payment",
        count: { $sum: 1 },
        appointments: {
          $push: {
            date: "$appointmentDetails.date",
            time: "$appointmentDetails.time",
            customerName: "$customerDetails.name",
            beautician: "$beauticianDetails.name",
            serviceName: "$serviceDetails.service_name",
            paymentMethod: "$payment",
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
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
  const startDate = moment().startOf("week").toDate();
  const endDate = moment().endOf("week").toDate();

  const customer = await Transaction.aggregate([
    {
      $lookup: {
        from: "appointments",
        localField: "appointment",
        foreignField: "_id",
        as: "appointmentDetails",
      },
    },
    {
      $unwind: "$appointmentDetails",
    },
    {
      $match: {
        // "appointmentDetails.date": { $gte: startDate, $lte: endDate },
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

exports.getAppointmentReportData = async () => {
  const serviceCounts = await Appointment.aggregate([
    {
      $lookup: {
        from: "transactions",
        localField: "_id",
        foreignField: "appointment",
        as: "transactionDetails",
      },
    },
    {
      $unwind: "$transactionDetails",
    },
    {
      $match: {
        "transactionDetails.status": {
          $in: ["completed", "pending", "cancelled"],
        },
      },
    },
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
      $lookup: {
        from: "users",
        localField: "customer",
        foreignField: "_id",
        as: "customerDetails",
      },
    },
    {
      $unwind: "$customerDetails",
    },
    {
      $lookup: {
        from: "users",
        localField: "beautician",
        foreignField: "_id",
        as: "beauticianDetails",
      },
    },
    {
      $unwind: "$beauticianDetails",
    },
    {
      $lookup: {
        from: "information",
        localField: "customer",
        foreignField: "customer",
        as: "informationDetails",
      },
    },
    {
      $unwind: "$informationDetails",
    },
    {
      $group: {
        _id: {
          type: "$serviceDetails.type",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        },
        appointmentCount: { $sum: 1 },
        customers: {
          $addToSet: {
            id: "$customerDetails._id",
            name: "$customerDetails.name",
            beautician: "$beauticianDetails.name",
            paymentMethod: "$transactionDetails.payment",
            serviceName: "$serviceDetails.service_name",
            status: "$transactionDetails.status",
            description: "$informationDetails.description",
            price: "$price",
            time: "$time",
          },
        },
      },
    },
    {
      $sort: { "_id.date": 1, "_id.type": 1 },
    },
    {
      $project: {
        _id: 0,
        type: "$_id.type",
        date: "$_id.date",
        appointmentCount: "$appointmentCount",
        customers: "$customers",
      },
    },
  ]);

  return serviceCounts;
};

exports.getTypeCountData = async () => {
  const delivery = await Delivery.aggregate([
    {
      $unwind: "$type",
    },
    {
      $lookup: {
        from: "products",
        localField: "product",
        foreignField: "_id",
        as: "productDetails",
      },
    },
    {
      $unwind: "$productDetails",
    },
    {
      $group: {
        _id: {
          type: "$type",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.type",
        totalCount: { $sum: "$count" },
      },
    },
    {
      $project: {
        _id: 0,
        type: "$_id",
        totalCount: 1,
      },
    },
  ]);

  return delivery;
};
