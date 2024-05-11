const Report = require("../models/report");
const Equipment = require("../models/equipment");
const ErrorHandler = require("../utils/errorHandler");
const mongoose = require("mongoose");
const { RESOURCE, STATUSCODE } = require("../constants/index");

exports.getAllReportsData = async () => {
  const reports = await Report.find()
    .sort({ createdAt: STATUSCODE.NEGATIVE_ONE })
    .populate({
      path: RESOURCE.EQUIPMENT,
      select: "equipment_name image",
    })
    .lean()
    .exec();

  return reports;
};

exports.getOneReportData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid Report ID: ${id}`);

  const report = await Report.findById(id)
    .populate({
      path: RESOURCE.EQUIPMENT,
      select: "equipment_name",
    })
    .lean()
    .exec();

  if (!report) throw new ErrorHandler(`Report not found with ID: ${id}`);

  return report;
};

exports.createReportData = async (req, res) => {
  const report = await Report.create({
    ...req.body,
  });

  const { equipment, quantity_missing, damage_quantity, status } = req.body;

  const lossEquipment = await Equipment.findById(equipment).lean().exec();

  let { _id, quantity, missing_qty, damage_qty } = lossEquipment;

  let equipmentQty = STATUSCODE.ZERO;
  let missingQty = STATUSCODE.ZERO;
  let damageQty = STATUSCODE.ZERO;

  const isMissing = status === "Missing";
  if (isMissing) {
    equipmentQty = quantity - quantity_missing;
    missingQty = missing_qty + quantity_missing;
  }

  const isDamage = status === "Damage";
  if (isDamage) {
    equipmentQty = quantity - damage_quantity;
    damageQty = damage_qty + damage_quantity;
  }

  const equipmentStatus =
    quantity === STATUSCODE.ZERO ? "Not Available" : "Available";

  await Equipment.findByIdAndUpdate(_id, {
    quantity: equipmentQty,
    missing_qty: missingQty,
    damage_qty: damageQty,
    status: equipmentStatus,
  });

  return report;
};

exports.updateReportData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid Report ID ${id}`);

  const report = await Report.findById(id).lean().exec();

  if (!report) throw new ErrorHandler(`Report not Found with ID: ${id}`);

  const updateReport = await Report.findByIdAndUpdate(
    id,
    {
      ...req.body,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  let { equipment, status, input_qty, quantity_missing, initial_found } =
    updateReport;

  const id = equipment;

  const reportEquipment = await Equipment.findById(id).lean().exec();

  if (!reportEquipment)
    throw new ErrorHandler(`Equipment not Found with ID: ${equipment}`);

  let { quantity, missing_qty, damage_qty, found_qty } = reportEquipment;

  if (input_qty > missing_qty)
    throw new ErrorHandler("Quantity Found should not exceed Missing Quantity");

  let newQuantity = quantity;
  let newMissingQty = missing_qty;
  let newDamageQty = damage_qty;
  let newFoundQty = found_qty;

  let OldMissing = quantity_missing;
  let initialFound = initial_found;

  const isFound = status === "Found" || "Partially Found";
  if (isFound) {
    newQuantity = quantity += input_qty;
    newMissingQty = missing_qty -= input_qty;
    newFoundQty = found_qty += input_qty;
    OldMissing = quantity_missing -= input_qty;
    initialFound = initial_found += input_qty;
  }

  const isDamage = status === "Found Damage";
  if (isDamage) {
    newMissingQty = missing_qty -= input_qty;
    newDamageQty = damage_qty + input_qty;
  }

  await Equipment.findByIdAndUpdate(
    id,
    {
      quantity: newQuantity,
      missing_qty: newMissingQty,
      damage_qty: newDamageQty,
      quantity_found: newFoundQty,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  updateReport.quantity_missing = OldMissing;
  updateReport.initial_found = initialFound;
  updateReport.input_qty = STATUSCODE.ZERO;
  await updateReport.save();

  return updateReport;
};

exports.deleteReportData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid Report ID: ${id}`);

  const report = await Report.findById(id).lean().exec();

  if (!report) throw new ErrorHandler(`Report not Found with ID: ${id}`);

  await Promise.all([
    Report.deleteOne({
      _id: id,
    })
      .lean()
      .exec(),
  ]);

  return report;
};
