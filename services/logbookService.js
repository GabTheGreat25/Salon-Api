const LogBook = require("../models/logbook");
const Equipment = require("../models/equipment");
const Report = require("../models/report");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { RESOURCE } = require("../constants/index");

exports.getAllLogsData = async () => {
  const logs = await LogBook.find()
    .populate({
      path: RESOURCE.USER,
      select: "name",
    })
    .populate({
      path: "equipment",
      populate: {
        path: "equipment",
        select: "equipment_name",
      },
    })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return logs;
};

exports.getOneLogData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid Logs ID ${id}`);
  }

  const log = await LogBook.findById(id)
    .populate({
      path: RESOURCE.USER,
      select: "name",
    })
    .populate({
      path: "equipment",
      populate: {
        path: "equipment",
        select: "equipment_name",
      },
    })
    .lean()
    .exec();

  return log;
};

exports.createLogsData = async (req, res) => {
  const log = await LogBook.create({
    ...req.body,
  });

  try {
    const newBorrowed = log?.equipment?.map((equipment) => {
      return equipment;
    });

    for (const equipment of newBorrowed) {
      const equipmentId = equipment?.equipment;
      const borrowedQty = equipment?.borrow_quantity;

      const borrowedEquipment = await Equipment.findById(equipmentId);

      if(borrowedEquipment.quantity === 0){
        throw new ErrorHandler(`${borrowedEquipment.equipment_name} is out of Stock`);
      };

      let { quantity, borrow_qty } = borrowedEquipment;

      let newQuantity = quantity - borrowedQty;
      let newBorrowedQuantity = borrow_qty + borrowedQty;
      const isZero = newQuantity === 0;
      console.log(isZero);

      const setStatus = isZero ? "Not Available" : "Available";

      const updateBorrowEquipment = await Equipment.findByIdAndUpdate(
        equipmentId,
        {
          quantity: newQuantity,
          borrow_qty: newBorrowedQuantity,
          status: setStatus
        },
        {
          new: true,
          runValidators: true,
        }
      );

    }
  } catch (err) {
    throw new ErrorHandler(err);
  }

  return log;
};

exports.updateLogsData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid LogBook ID:${id}`);
  }

  const existingLogBook = await LogBook.findById(id)
    .populate({
      path: RESOURCE.USER,
      select: "name",
    })
    .lean()
    .exec();

  if (!existingLogBook) {
    throw new ErrorHandler(`Logbook not found with ID ${id}`);
  }

  const dateToday = new Date();

  const updateLogBook = await LogBook.findByIdAndUpdate(
    id,
    {
      ...req.body,
      date_returned: dateToday,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .lean()
    .exec();

  try {
    const newEquipment = updateLogBook?.equipment?.map((equipment) => {
      return equipment;
    });

    for (const equipmentBorrowed of newEquipment) {
      const {
        equipment,
        borrow_quantity,
        missing_quantity,
        damage_quantity,
        status,
      } = equipmentBorrowed;

      if (
        missing_quantity > borrow_quantity ||
        damage_quantity > borrow_quantity
      ) {
        throw new ErrorHandler(
          "Missing or damage quantity cannot exceed borrow quantity"
        );
      }

      const equipmentId = equipment;
      const newEquipment = await Equipment.findById(equipmentId).lean().exec();

      if (!newEquipment) {
        throw new ErrorHandler("Equipment not Found");
      }

      let { missing_qty, damage_qty, quantity, borrow_qty } = newEquipment;

      let newMissingQty = missing_qty + missing_quantity;
      let newDamageQty = damage_qty + damage_quantity;

      let lossQty;
      let newQuantity;
      let newBorrow;

      const isBorrowed = updateLogBook?.status?.includes("Borrowed");
      const isReturned = updateLogBook?.status?.includes("Returned");

      if (isBorrowed) {
        newBorrow = borrow_quantity;
        newQuantity = quantity - newBorrow;

      } else if (isReturned) {
        lossQty = missing_quantity + damage_quantity;
        newQuantity = quantity + borrow_quantity - lossQty;
        newBorrow = borrow_qty - borrow_quantity;
      }

      const isZero = newQuantity == 0;

      const setStatus = isZero ? "Not Available" : "Available";

      const updateEquipment = await Equipment.findByIdAndUpdate(
        equipmentId,
        {
          missing_qty: newMissingQty,
          damage_qty: newDamageQty,
          borrow_qty: newBorrow,
          quantity: newQuantity,
          status: setStatus,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      const isMissing = status === "Missing" && missing_quantity >= 1;
      const isDamage = status === "Damage" && damage_quantity >= 1;
      const isMissingAndDamage =
        status === "Damage & Missing" &&
        missing_quantity >= 1 &&
        damage_quantity >= 1;

      const insertDate = isMissing || isMissingAndDamage ? dateToday : "";

      let statusReport = "";

      if (isMissing) {
        statusReport = "Missing";
      } else if (isDamage) {
        statusReport = "Damage";
      } else if (isMissingAndDamage) {
        statusReport = "Missing & Damage";
      }

      if (isMissing || isDamage || isMissingAndDamage) {
        console.log("Report Created!")
        const report = await Report.create({
          user: updateLogBook?.user,
          equipment: equipmentId,
          date_missing: insertDate,
          quantity_missing: newMissingQty,
          damage_quantity: newDamageQty,
          status: statusReport,
        });
      }
    }
  } catch (err) {
    throw new ErrorHandler(err);
  }
  return updateLogBook;
};

exports.deleteLogBookData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid LogBook ID ${id}`);
  }

  const logbook = await LogBook.findById(id)
    .populate({
      path: RESOURCE.USER,
      select: "name",
    })
    .lean()
    .exec();

  if (!logbook) {
    throw new ErrorHandler(`LogBook not found with ID ${id}`);
  }

  await Promise.all([
    LogBook.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return logbook;
};
