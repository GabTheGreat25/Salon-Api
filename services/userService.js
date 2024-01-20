const User = require("../models/user");
const Schedule = require("../models/schedule");
const Transaction = require("../models/transaction");
const Appointment = require("../models/appointment");
const Requirement = require("../models/requirement");
const Information = require("../models/information");
const Verification = require("../models/verification");
const Comment = require("../models/comment");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require("bcrypt");
const token = require("../utils/token");
const { cloudinary } = require("../utils/cloudinary");
const { STATUSCODE, RESOURCE, ROLE } = require("../constants/index");
const { sendSMS } = require("../utils/twilio");
const blacklistedTokens = [];

const generateRandomCode = () => {
  const length = 6;
  let code = "";

  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }

  return code;
};

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

const sendMonthlyUpdate = async (user, monthDifference) => {
  let customMessage;
  monthDifference %= 12;
  if (monthDifference === 0) {
    customMessage = "Happy New Year! Check out our new products this month!";
  } else if (monthDifference === 1) {
    customMessage = "Special discounts available this February!";
  } else if (monthDifference === 2) {
    customMessage = "Spring is here! Enjoy our seasonal offerings.";
  } else if (monthDifference === 3) {
    customMessage = "Summer is in full swing! Stay cool with our products.";
  } else if (monthDifference === 4) {
    customMessage = "May brings hot deals! Don't miss out!";
  } else if (monthDifference === 5) {
    customMessage = "Celebrate June with exclusive promotions!";
  } else if (monthDifference === 6) {
    customMessage = "Fall into savings this July!";
  } else if (monthDifference === 7) {
    customMessage = "Thankful August! Enjoy discounts on us.";
  } else if (monthDifference === 8) {
    customMessage = "Thankful September! Enjoy discounts on us.";
  } else if (monthDifference === 9) {
    customMessage =
      "Festive October! Celebrate Halloween with our spooky specials.";
  } else if (monthDifference === 10) {
    customMessage =
      "Happy Halloween! Check out our spooky specials this November.";
  } else if (monthDifference === 11) {
    customMessage =
      "Merry Christmas! Check out our holiday specials this December!";
  } else {
    customMessage = "Thank you for being our valued customer!";
  }
  const smsMessage = `Dear ${user.name}, ${customMessage}`;

  await sendSMS(`+63${user.contact_number.substring(1)}`, smsMessage);
};

exports.sendPasswordResetSMS = async (req, email) => {
  if (!email) throw new ErrorHandler("Please provide an email");

  const user = await User.findOne({ email });

  if (!user) throw new ErrorHandler("User not found");

  const currentTime = new Date();
  const lastCodeSentTime = user.verificationCode.createdAt;

  const timeDifferenceMilliseconds = currentTime - lastCodeSentTime;
  if (timeDifferenceMilliseconds < 5 * 60 * 1000) {
    throw new ErrorHandler(
      "Please wait 5 minutes before requesting a new verification code"
    );
  }

  const verificationCode = generateRandomCode();
  user.verificationCode.code = verificationCode;
  user.verificationCode.createdAt = currentTime;
  await user.save();

  const smsMessage = `Your verification code is: ${verificationCode}. Use this code to reset your password. Ignore if you didn't request a password reset.`;

  await sendSMS(`+63${user.contact_number.substring(1)}`, smsMessage);

  return `Verification code SMS sent successfully to ${user.contact_number}`;
};

exports.sendResetPassword = async (
  verificationCode,
  newPassword,
  confirmPassword,
  req
) => {
  const user = await User.findOne({
    "verificationCode.code": verificationCode,
  });

  if (!user) throw new ErrorHandler("Invalid or expired verification code");

  const expirationTime = 5 * 60 * 1000;
  const codeCreatedAt = user.verificationCode.createdAt;

  if (Date.now() - codeCreatedAt.getTime() > expirationTime) {
    user.verificationCode = null;
    await user.save();
    throw new ErrorHandler("Verification code has expired");
  }

  if (newPassword !== confirmPassword)
    throw new ErrorHandler("Passwords don't match");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(process.env.SALT_NUMBER)
  );
  user.password = hashedPassword;
  user.verificationCode = null;
  await user.save();

  const successMessage = `Your password has been successfully reset. If you did not perform this action, please contact support immediately.`;

  await sendSMS(`+63${user.contact_number.substring(1)}`, successMessage);

  return `Password updated successfully for user with email ${user.email}`;
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

  const smsMessage = `Dear ${user.name}, your account has been successfully activated. Thank you for choosing Lhanlee Salon.`;

  await sendSMS(`+63${user.contact_number.substring(1)}`, smsMessage);

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
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid user ID: ${id}`);

  const user = await User.findById(id).lean().exec();

  if (!user) throw new ErrorHandler(`User not found with ID: ${id}`);

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
  let requirement;
  let information;

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
    const selectedDate = new Date(`${req.body.date} ${req.body.time}`);
    if (
      !(
        selectedDate >= currentDate &&
        selectedDate <=
          new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      )
    )
      throw new ErrorHandler(
        "Invalid date. Date must be within the next 7 days and not in the past."
      );

    const existingRequirement = await Requirement.findOne({
      date: req.body.date,
      time: req.body.time,
    });

    if (existingRequirement)
      throw new ErrorHandler(
        "Someone already has an appointment at this date and time."
      );

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

    requirement = await Requirement.create({
      beautician: user?._id,
      job_type: req.body.job_type,
      date: req.body.date,
      time: req.body.time,
    });

    const smsMessage = `Dear ${user.name}, your account has been successfully created. Please attend your setup meeting at the salon.`;

    await sendSMS(`+63${user.contact_number.substring(1)}`, smsMessage);

    const deletionTime =
      selectedDate.getTime() + 7 * 24 * 60 * 60 * 1000 - currentDate.getTime();

    // const deletionTime =
    //   selectedDate.getTime() + 1 * 60 * 1000 - currentDate.getTime();

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

    const currentDate = new Date();
    let nextMessageDate = new Date(currentDate.getTime());

    information = await Information.create({
      customer: user?._id,
      description: req.body.description,
      allergy: req.body.allergy,
      product_preference: req.body.product_preference,
      created_at: currentDate,
      messageDate: req.body.messageDate || "1 minute",
    });

    let delay;

    if (information.messageDate === "1 minute") {
      delay = 1 * 60 * 1000;
    } else if (information.messageDate === "1 month") {
      delay = 30 * 24 * 60 * 60 * 1000;
    } else if (information.messageDate === "2 months") {
      delay = 2 * 30 * 24 * 60 * 60 * 1000;
    } else if (information.messageDate === "4 months") {
      delay = 4 * 30 * 24 * 60 * 60 * 1000;
    } else if (information.messageDate === "6 months") {
      delay = 6 * 30 * 24 * 60 * 60 * 1000;
    } else if (information.messageDate === "1 year") {
      delay = 12 * 30 * 24 * 60 * 60 * 1000;
    } else if (information.messageDate === "stop") {
      return { user, requirement, information };
    } else {
      throw new ErrorHandler("Invalid messageDate");
    }

    if (delay !== undefined) {
      setTimeout(async () => {
        const existingInformation = await Information.findOne({
          customer: user?._id,
          messageDate: { $ne: "stop" },
        });

        if (
          !existingInformation ||
          existingInformation.messageDate === "stop"
        ) {
          return { user, requirement, information };
        }

        const monthDifference =
          (nextMessageDate.getFullYear() - currentDate.getFullYear()) * 12 +
          (nextMessageDate.getMonth() - currentDate.getMonth());
        await sendMonthlyUpdate(user, monthDifference);

        const sendInterval = setInterval(async () => {
          const currentDate = new Date();
          nextMessageDate = new Date(currentDate.getTime() + delay);

          const existingUser = await User.findById(user?._id);
          if (!existingUser || existingInformation.messageDate === "stop") {
            clearInterval(sendInterval);
            return;
          }

          const monthDifference =
            (nextMessageDate.getFullYear() - currentDate.getFullYear()) * 12 +
            (nextMessageDate.getMonth() - currentDate.getMonth());
          await sendMonthlyUpdate(user, monthDifference);
        }, delay);
      }, delay);
    }
  }

  return { user, requirement, information };
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

  if (existingUser.image && existingUser.image.length > 0) {
    await cloudinary.api.delete_resources(
      existingUser.image.map((image) => image.public_id)
    );
  }

  let roles = existingUser.roles;

  if (req.body.roles) {
    roles = Array.isArray(req.body.roles)
      ? req.body.roles
      : req.body.roles.split(", ");
  }

  const user = await User.findByIdAndUpdate(
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

  if (!user) throw new ErrorHandler(`User not found with ID: ${id}`);

  let requirement;
  let information;

  if (roles.includes(ROLE.BEAUTICIAN)) {
    requirement = await Requirement.findOneAndUpdate(
      { beautician: id },
      {
        job_type: req.body.job_type,
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();
  } else if (
    roles.includes(ROLE.ONLINE_CUSTOMER) ||
    roles.includes(ROLE.WALK_IN_CUSTOMER)
  ) {
    information = await Information.findOneAndUpdate(
      { customer: id },
      {
        description: req.body.description,
        allergy: req.body.allergy,
        product_preference: req.body.product_preference,
        messageDate: req.body.messageDate,
      },
      { new: true, upsert: true }
    )
      .lean()
      .exec();

    let delay;

    if (information.messageDate === "1 minute") {
      delay = 1 * 60 * 1000;
    } else if (information.messageDate === "1 month") {
      delay = 30n * 24n * 60n * 60n * 1000n;
    } else if (information.messageDate === "2 months") {
      delay = 2n * 30n * 24n * 60n * 60n * 1000n;
    } else if (information.messageDate === "4 months") {
      delay = 4n * 30n * 24n * 60n * 60n * 1000n;
    } else if (information.messageDate === "6 months") {
      delay = 6n * 30n * 24n * 60n * 60n * 1000n;
    } else if (information.messageDate === "1 year") {
      delay = 12n * 30n * 24n * 60n * 60n * 1000n;
    } else if (information.messageDate === "stop") {
      return { user, requirement, information };
    } else {
      throw new ErrorHandler("Invalid messageDate");
    }

    if (delay !== undefined) {
      setTimeout(async () => {
        const existingInformation = await Information.findOne({
          customer: id,
          messageDate: { $ne: "stop" },
        });

        if (
          !existingInformation ||
          existingInformation.messageDate === "stop"
        ) {
          return { user, requirement, information };
        }

        const currentDate = new Date();
        let nextMessageDate = new Date(BigInt(currentDate.getTime()) + delay);
        const monthDifference =
          (nextMessageDate.getFullYear() - currentDate.getFullYear()) * 12 +
          (nextMessageDate.getMonth() - currentDate.getMonth());
        await sendMonthlyUpdate(user, monthDifference);

        const sendInterval = setInterval(async () => {
          const currentDate = new Date();
          nextMessageDate = new Date(BigInt(currentDate.getTime()) + delay);

          const existingUser = await User.findById(id);
          if (!existingUser || existingInformation.messageDate === "stop") {
            clearInterval(sendInterval);
            return;
          }

          const monthDifference =
            (nextMessageDate.getFullYear() - currentDate.getFullYear()) * 12 +
            (nextMessageDate.getMonth() - currentDate.getMonth());
          await sendMonthlyUpdate(user, monthDifference);
        }, Number(delay));
      }, Number(delay));
    }
  }

  return { user, requirement, information };
};

exports.deleteUserData = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id))
    throw new ErrorHandler(`Invalid user ID: ${id}`);

  const user = await User.findOne({ _id: id });
  if (!user) throw new ErrorHandler(`User not found with ID: ${id}`);

  const publicIds = user.image.map((image) => image.public_id);

  const appointment = await Appointment.findOne({
    $or: [{ customer: id }, { beautician: id }],
  });

  const appointmentId = appointment?._id;

  const transaction = await Transaction.findOne({
    appointment: appointmentId,
  });

  const transactionId = transaction?._id;

  await Promise.all([
    User.deleteOne({ _id: id }).lean().exec(),
    Schedule.deleteMany({ beautician: id }).lean().exec(),
    Appointment.deleteMany({
      $or: [{ customer: id }, { beautician: id }],
    })
      .lean()
      .exec(),
    Transaction.deleteMany({
      appointment: appointmentId,
    })
      .lean()
      .exec(),
    Verification.deleteMany({
      transaction: transactionId,
    })
      .lean()
      .exec(),
    Comment.deleteMany({
      transaction: transactionId,
    })
      .lean()
      .exec(),
    Requirement.deleteMany({ beautician: id }).lean().exec(),
    Information.deleteMany({ customer: id }).lean().exec(),
    cloudinary.api.delete_resources(publicIds),
  ]);

  return user;
};
