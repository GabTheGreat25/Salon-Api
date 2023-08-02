const ErrorHandler = require("../utils/errorHandler");
const { RESOURCE } = require("../constants/index");

const checkRequiredFields = (fields) => (req, res, next) => {
  const missingFields = fields?.filter((field) =>
    field === RESOURCE.IMAGE
      ? !req.body?.image && !req?.files
      : !req?.body[field]
  );
  if (missingFields.length)
    return next(
      new ErrorHandler(
        JSON.stringify(
          missingFields?.map((field) => ({ [field]: ` ${field} is required` }))
        )?.replace(/[{}\[\]\\"]/g, "")
      )
    );
  next();
};

module.exports = checkRequiredFields;
