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

const deleteUserAfterTimeout = async (userId) => {
  const user = await User.findById(userId);
  if (user && !user.active) {
    const publicIds = user.image.map((image) => image.public_id);

    await Promise.all([
      User.findByIdAndDelete(userId).lean().exec(),
      Requirement.deleteMany({ beautician: userId }).lean().exec(),
      cloudinary.api.delete_resources(publicIds),
    ]);
  }
};

exports.updatePassword = async (
  id,
  oldPassword,
  newPassword,
  confirmPassword
) => {
  const user = await User.findById(id).select("+password");

  if (!user) throw new ErrorHandler("User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isMatch) throw new ErrorHandler("Invalid old password");

  if (newPassword !== confirmPassword)
    throw new ErrorHandler("Passwords do not match");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(process.env.SALT_NUMBER)
  );

  user.password = hashedPassword;

  await user.save();

  return user;
};

exports.confirmUserRole = async (userId) => {
  const user = await User.findById(userId);

  if (!user) throw new ErrorHandler(`User not found with ID: ${userId}`);

  if (user.active) throw new ErrorHandler(`User already activated`);

  user.active = true;

  await user.save();

  return user;
};

exports.loginToken = async (email, password) => {
  const foundUser = await User.findOne({
    email,
  })
    .select("+password")
    .exec();

  if (!foundUser) throw new ErrorHandler("Email not found or not existing");

  if (!foundUser.active)
    throw new ErrorHandler(
      "User can't log in because you are not authenticated by an admin"
    );

  const match = await bcrypt.compare(password, foundUser.password);

  if (!match) throw new ErrorHandler("Wrong Password");

  const accessToken = token.generateAccessToken(
    foundUser.email,
    foundUser.roles
  );

  const accessTokenMaxAge = 7 * 24 * 60 * 60 * 1000;

  if (foundUser.roles.includes(ROLE.BEAUTICIAN)) {
    foundUser.requirement = await Requirement.findOne({
      beautician: foundUser._id,
    })
      .lean()
      .exec();
  } else if (
    foundUser.roles.includes(ROLE.ONLINE_CUSTOMER) ||
    foundUser.roles.includes(ROLE.WALK_IN_CUSTOMER)
  ) {
    foundUser.information = await Information.findOne({
      customer: foundUser._id,
    })
      .lean()
      .exec();
  }

  return {
    user: foundUser,
    accessToken,
    accessTokenMaxAge,
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

  const allUsers = await Promise.all(
    users?.map(async (user) => {
      if (user.roles.includes(ROLE.BEAUTICIAN)) {
        user.requirement = await Requirement.findOne({
          beautician: user?._id,
        })
          .lean()
          .exec();
      } else if (
        user.roles.includes(ROLE.ONLINE_CUSTOMER) ||
        user.roles.includes(ROLE.WALK_IN_CUSTOMER)
      ) {
        user.information = await Information.findOne({
          customer: user?._id,
        })
          .lean()
          .exec();
      }

      return user;
    })
  );

  return allUsers;
};

exports.getSingleUserData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ErrorHandler(`Invalid user ID: ${id}`);
  }

  const user = await User.findById(id).lean().exec();

  if (!user) {
    throw new ErrorHandler(`User not found with ID: ${id}`);
  }

  if (user.roles.includes(ROLE.BEAUTICIAN)) {
    user.requirement = await Requirement.findOne({
      beautician: id,
    })
      .lean()
      .exec();
  } else if (
    user.roles.includes(ROLE.ONLINE_CUSTOMER) ||
    user.roles.includes(ROLE.WALK_IN_CUSTOMER)
  ) {
    user.information = await Information.findOne({
      customer: id,
    })
      .lean()
      .exec();
  }

  return user;
};

exports.createUserData = async (req, res) => {
  let userImages = [];
  if (req.files && Array.isArray(req.files)) {
    userImages = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.secure_url,
          originalname: file.originalname,
        };
      })
    );
  }

  if (userImages.length === STATUSCODE.ZERO)
    throw new ErrorHandler("At least one image is required");

  const roles = req.body.roles
    ? Array.isArray(req.body.roles)
      ? req.body.roles
      : req.body.roles.split(", ")
    : [ROLE.ONLINE_CUSTOMER];

  const active =
    roles.includes(ROLE.ADMIN) ||
    roles.includes(ROLE.ONLINE_CUSTOMER) ||
    roles.includes(ROLE.WALK_IN_CUSTOMER);

  let user;
  let newRequirement;
  let newInformation;

  if (roles.includes(ROLE.ADMIN)) {
    user = await User.create({
      name: req.body.name,
      age: req.body.age,
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
  } else if (roles.includes(ROLE.BEAUTICIAN)) {
    const currentDate = new Date();
    const selectedDate = new Date(req.body.date);
    if (
      !(
        selectedDate >= currentDate &&
        selectedDate <=
          new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      )
    ) {
      throw new ErrorHandler(
        "Invalid date. Date must be within the next 7 days and not in the past."
      );
    }

    user = await User.create({
      name: req.body.name,
      age: req.body.age,
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

    newRequirement = await Requirement.create({
      beautician: user?._id,
      job: req.body.job,
      date: req.body.date,
      time: req.body.time,
    });

    const deletionTime =
      selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000 - currentDate.getTime();

    setTimeout(async () => {
      await deleteUserAfterTimeout(user?._id);
    }, deletionTime);
  } else {
    user = await User.create({
      name: req.body.name,
      age: req.body.age,
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
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid user ID: ${id}`);

  const existingUser = await User.findById(id).lean().exec();

  if (!existingUser) throw new ErrorHandler(`User not found with ID: ${id}`);

  let images = existingUser.image || [];

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    images = await Promise.all(
      req.files.map(async (file) => {
        const result = await cloudinary.uploader.upload(file.path, {
          public_id: file.filename,
        });
        return {
          public_id: result.public_id,
          url: result.secure_url,
          originalname: file.originalname,
        };
      })
    );
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

  if (roles.includes(ROLE.BEAUTICIAN)) {
    updateRequirement = await Requirement.findOneAndUpdate(
      { beautician: id },
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
                  url: result.secure_url,
                  originalname: file.originalname,
                };
              })
            )
          : images,
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();
  } else if (
    roles.includes(ROLE.ONLINE_CUSTOMER) ||
    roles.includes(ROLE.WALK_IN_CUSTOMER)
  ) {
    updateInformation = await Information.findOneAndUpdate(
      { customer: id },
      {
        description: req.body.description,
        allergy: req.body.allergy,
        product_preference: req.body.product_preference,
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();
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
    Schedule.deleteMany({ beautician: id }).lean().exec(),
    Appointment.deleteMany({ $or: [{ customer: id }, { beautician: id }] })
      .lean()
      .exec(),
    Transaction.deleteMany({ customer: id }).lean().exec(),
    Requirement.deleteMany({ beautician: id }).lean().exec(),
    Information.deleteMany({ customer: id }).lean().exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return user;
};
