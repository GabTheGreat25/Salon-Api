const User = require("../models/user");
const Schedule = require("../models/schedule");
const Appointment = require("../models/appointment");
const Transaction = require("../models/transaction");
const Requirement = require("../models/requirement");
const Information = require("../models/information");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require("bcrypt");
const token = require("../utils/token");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE, RESOURCE, ROLE } = require("../constants/index");
const blacklistedTokens = [];

exports.confirmUserRole = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new ErrorHandler(`User not found with ID: ${userId}`);

  if (user.active) throw new ErrorHandler(`User already activated`);

  user.active = true;

  await user.save()
};

exports.loginToken = async (email, password) => {
  const foundUser = await User.findOne({
    email
  }).select("+password").exec();

  if (!foundUser) throw new ErrorHandler("Email not found or not existing");

  if (!foundUser.active) throw new ErrorHandler("User can't log in because you are not authenticated by an admin");

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) throw ErrorHandler("Wrong Password");

  const accessToken = token.generateAccessToken(
    foundUser.email,
    foundUser.roles
  );

  const accessTokenMaxAge = 7 * 24 * 60 * 60 * 1000;

  if (foundUser.roles.includes(ROLE.EMPLOYEE)) {
    foundUser.requirement = await Requirement.findOne({
      employee: foundUser._id
    }).lean().exec();
  } else if (foundUser.roles.includes(ROLE.ONLINE_CUSTOMER) || foundUser.roles.includes(ROLE.WALK_IN_CUSTOMER)) {
    foundUser.information = await Information.findOne({
      customer: foundUser._id
    }).lean().exec();
  }

  return {
    user: foundUser,
    accessToken,
    accessTokenMaxAge
  };
};

exports.logoutUser = (cookies, res) => {
  return new Promise((resolve, reject) => {
    !cookies?.jwt
      ? reject(new Error("You are not logged in"))
      : (blacklistedTokens.push(cookies.jwt),
        res.clearCookie(RESOURCE.JWT, {
          httpOnly: true,
          secure: process.env.NODE_ENV === RESOURCE.PRODUCTION,
          sameSite: RESOURCE.NONE,
        }),
        resolve());
  });
};

exports.getBlacklistedTokens = () => {
  return blacklistedTokens;
};

exports.getAllUsersData = async () => {
  const users = await User.find().sort({ createdAt: -1 }).lean().exec();

  return users;
};

exports.getSingleUserData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid user ID: ${id}`);
  }

  const user = await User.findById(id).lean().exec();

  if (!user) {
    throw new ErrorHandler(`User not found with ID: ${id}`);
  }

  if (user.roles.includes(ROLE.EMPLOYEE)) {
    user.requirement = await Requirement.findOne({
      employee: id
    }).lean().exec();
  } else if (user.roles.includes(ROLE.ONLINE_CUSTOMER) || user.roles.includes(ROLE.WALK_IN_CUSTOMER)) {
    user.information = await Information.findOne({
      customer: id
    }).lean().exec();
  }

  return user;
};

exports.createUserData = async (req, res) => {
  const duplicateUser = await User.findOne({ name: req.body.name })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateUser) throw new ErrorHandler("Duplicate name");

  let userImages = [];
  if (req.files && Array.isArray(req.files)) {
    userImages = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      }));
  }

  if (userImages.length === STATUSCODE.ZERO)
    throw new ErrorHandler("At least one image is required");

  const roles = req.body.roles
    ? Array.isArray(req.body.roles)
      ? req.body.roles
      : req.body.roles.split(", ")
    : [ROLE.ONLINE_CUSTOMER];

  const active = roles.includes(ROLE.ADMIN) || roles.includes(ROLE.ONLINE_CUSTOMER) || roles.includes(ROLE.WALK_IN_CUSTOMER);

  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: await bcrypt.hash(
      req.body.password,
      Number(process.env.SALT_NUMBER)
    ),
    contact_number: req.body.contact_number,
    roles: roles,
    image: userImages,
    active: active,
  });

  let newRequirement;
  let newInformation;

  if (roles.includes(ROLE.EMPLOYEE)) {
    let docsImages = [];
    if (req.files && Array.isArray(req.files)) {
      docsImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path, {
            public_id: file.filename,
          });
          return {
            public_id: result.public_id,
            url: result.url,
            originalname: file.originalname,
          };
        }));
    }
    if (docsImages.length === STATUSCODE.ZERO) throw new ErrorHandler("At least one docs is required");

    newRequirement = await Requirement.create({
      employee: user?._id,
      job: req.body.job,
      image: docsImages,
    });
  } else if (roles.includes(ROLE.ONLINE_CUSTOMER) || roles.includes(ROLE.WALK_IN_CUSTOMER)) {
    newInformation = await Information.create({
      customer: user?._id,
      description: req.body.description,
      allergy: req.body.allergy,
      product_preference: req.body.product_preference,
    });
  }

  return { user, newRequirement, newInformation };
};

exports.updateUserData = async (req, res, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ErrorHandler(`Invalid user ID: ${id}`);

  const existingUser = await User.findById(id).lean().exec();

  if (!existingUser) throw new ErrorHandler(`User not found with ID: ${id}`);

  const duplicateUser = await User.findOne({
    name: req.body.name,
    _id: { $ne: id },
  })
    .collation({ locale: "en" })
    .lean()
    .exec();

  if (duplicateUser) throw new ErrorHandler("Duplicate name");

  let images = existingUser.image || [];

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.url,
          originalname: file.originalname,
        };
      }
    ));
  }

  let roles = existingUser.roles;

  if (req.body.roles) {
    roles = Array.isArray(req.body.roles)
      ? req.body.roles
      : req.body.roles.split(", ");
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    {
      ...req.body,
      roles: roles,
      image: images,
    },
    {
      new: true,
      runValidators: true,
    }
  )
    .lean()
    .exec();

  if (!updatedUser) throw new ErrorHandler(`User not found with ID: ${id}`);

  let updateRequirement;
  let updateInformation;

  if (roles.includes(ROLE.EMPLOYEE)) {
    updateRequirement = await Requirement.findOneAndUpdate(
      { employee: id },
      {
        job: req.body.job,
        docsImages: req.files
          ? await Promise.all(
              req.files.map(async (file) => {
                const result = await cloudinary.uploader.upload(file.path, {
                  public_id: file.filename,
                });
                return {
                  public_id: result.public_id,
                  url: result.url,
                  originalname: file.originalname,
                };
              }
            )
          ): images
      },
      { new: true, upsert: true }
    ).lean().exec();
  } else if (roles.includes(ROLE.ONLINE_CUSTOMER) || roles.includes(ROLE.WALK_IN_CUSTOMER)) {
    updateInformation = await Information.findOneAndUpdate(
      { customer: id },
      {
        description: req.body.description,
        allergy: req.body.allergy,
        product_preference: req.body.product_preference,
      },
      { new: true, upsert: true }
    ).lean().exec();
  }

  return { updatedUser, updateRequirement, updateInformation };
};

exports.deleteUserData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid user ID: ${id}`);

  const user = await User.findOne({ _id: id });
  if (!user) throw new ErrorHandler(`User not found with ID: ${id}`);

  const publicIds = user.image.map((image) => image.public_id);

  await Promise.all([
    User.deleteOne({ _id: id }).lean().exec(),
    Schedule.deleteMany({ employee: id }).lean().exec(),
    Appointment.deleteMany({ $or: [{ customer: id }, { employee: id }] }).lean().exec(),
    Transaction.deleteMany({ customer: id }).lean().exec(),
    Requirement.deleteMany({ employee: id }).lean().exec(),
    Information.deleteMany({ customer: id }).lean().exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return user;
};
