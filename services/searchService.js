const Service = require("../models/service");

exports.SearchServices = async (searchService) => {
  const serviceName = await Service.findOne({
    $or: [
      { service_name: { $regex: ".*" + searchService + ".*", $options: "i" } },
      { description: { $regex: ".*" + searchService + ".*", $options: "i" } } 
    ]
  })
    .collation({
      locale: "en",
    })
    .lean()
    .exec();

  return serviceName;
};


