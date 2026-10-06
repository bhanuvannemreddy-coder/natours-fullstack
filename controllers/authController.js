const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    //we have to attach the cookie to the res obj and first arg is cookie name and value and 3rd arg
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1.Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }
  //2. Check if user exists and password is correct

  const user = await User.findOne({ email }).select("+password");
  // as user is document and correctPassword is an instance method ie it can be used on all documents of a collection soo
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //3 If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
  res.status(200).json({ status: "success", data: { user: req.user } });
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1. Get the token and check if it exists

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401),
    );
  }

  // 2. Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token does no longer exist", 401),
    );
  }

  // 4. Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decoded.iat))
    return next(
      new AppError("Recently changed password! Please log in again.", 401),
    );
  // 5. Grant access to protected route
  req.user = currentUser;
  console.log(req.user.role);
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles ['admin','lead-guide'].  role='user'
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You dont have permission to perform this action", 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("There is no user with this email address.", 404));
  }

  // 2. Generate random reset token
  const resetToken = user.createPasswordResetToken();

  await user.save({ validateBeforeSave: false });

  // 3. Create reset URL for the FRONTEND
  const resetURL = `${process.env.FRONTEND_URL}/#reset/${resetToken}`;

  const message = `Forgot your password?

Click the link below to reset your password:

${resetURL}

This link is valid for 10 minutes.

If you did not request a password reset, please ignore this email.`;

  // 4. Send email
  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });
  } catch (err) {
    console.log("🔥 EMAIL ERROR:", err);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending the email. Try again later!",
        500,
      ),
    );
  }

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
  });
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2. Check whether token is valid and hasn't expired
  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // 3. Set the new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;

  // 4. Remove reset token so it cannot be reused
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // 5. Save the new password
  await user.save();

  // 6. Log the user in and send JWT
  createSendToken(user, 200, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
  //this is only for the logged in user and user have to give his old pass to check if it is correct or not
  //this is a security measure otherwiise other users may update this when the original user logged in

  //1.Get user from collection

  const user = await User.findById(req.user.id).select("+password");

  //2. Check if posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }
  //3.If so ,update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findAndUpdate doesn't work here we have do it like this

  //4.Log user in send JWT
  createSendToken(user, 200, res);
});
