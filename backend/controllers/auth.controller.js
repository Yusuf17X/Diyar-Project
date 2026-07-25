import prisma from "../utils/prisma.js";
import crypto from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import catchAsync from "./../utils/catchAsync.js";
import AppError from "./../utils/appError.js";
import auditEmitter from "../utils/auditEmitter.js";

import * as authService from "../services/auth.service.js";
import sendSMS from "../utils/sms.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user.id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  // 'httpOnly' prevents client-side JS from reading the cookie

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const { password, passwordConfirm } = req.body;

  if (!password || !passwordConfirm) {
    return next(new AppError("Password and confirmation are required!", 400));
  }

  if (!authService.checkPassword(password, passwordConfirm)) {
    return next(new AppError("Passwords do not match!", 400));
  }

  const hashedPassword = await authService.hashPassword(password);

  const newUser = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    },
  });

  createSendToken(newUser, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new AppError("Please provide email and password!", 400));

  const user = await prisma.user.findUnique({
    where: { email },
    omit: { password: false },
  });

  // Validate user exists and password matches
  if (!user || !(await authService.comparePassword(password, user.password))) {
    // If we found the user but they typed the wrong password, emit an audit trail
    if (user && user.propertyId) {
      auditEmitter.emit("audit.log", {
        propertyId: user.propertyId,
        actorId: user.id,
        event: "USER_LOGIN_FAILED",
        entityType: "USER",
        entityId: user.id,
        message: `Failed login attempt for user ${user.email}`,
      });
    }
    return next(new AppError("Incorrect email or password!", 401));
  }

  // Audit successful login
  if (user.propertyId) {
    auditEmitter.emit("audit.log", {
      propertyId: user.propertyId,
      actorId: user.id,
      event: "USER_LOGIN",
      entityType: "USER",
      entityId: user.id,
      message: `User ${user.email} successfully logged in.`,
    });
  }

  createSendToken(user, 200, res);
});

export const protect = catchAsync(async (req, res, next) => {
  // Getting token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError("You are not logged in! Please login to get access.", 401),
    );
  }

  // Verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exists
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
  });

  if (!user)
    return next(
      new AppError(
        "The user belonging to this token does no longer exist!",
        401,
      ),
    );

  // Check if user changed password after the token was issued
  if (authService.changedPasswordAfter(user.passwordChangedAt, decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please login again.", 401),
    );
  }

  // Grant access to protected route
  req.user = user;
  next();
});

export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // i.e. roles = ["user", "admin"]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action!", 403),
      );
    }
    next();
  };
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on POSTed email
  const user = await prisma.user.findUnique({
    where: { email: req.body.email },
  });

  // If no user with that email.. hacker wont know it does not exist
  if (user) {
    if (!user.phone) {
      return next(
        new AppError(
          "There is no phone number associated with this account.",
          400,
        ),
      );
    }

    // Generate the random token
    const resetToken = await authService.createPasswordResetToken(user.id);

    const resetURL = `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you did not forget your password please ignore this message!`;

    try {
      const result = await sendSMS({
        to: user.phone,
        message,
      });

      if (!result.success) {
        throw new Error(result.error || "SMS sending failed");
      }
    } catch (err) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      return next(
        new AppError("There was error sending the SMS. Try again later!", 500),
      );
    }
  }

  res.status(200).json({
    status: "success",
    message: "Token sent via SMS!",
  });
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // Hash the token to compare with stored hashed token in db
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: { gt: new Date() },
    },
  });

  if (!user) return next(new AppError("Token is invalid or has expired!", 400));

  if (!authService.checkPassword(req.body.password, req.body.passwordConfirm)) {
    return next(new AppError("Passwords do not match!", 400));
  }

  // Save the new password and clear reset token and expiry
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await authService.hashPassword(req.body.password),
      passwordResetToken: null,
      passwordResetExpires: null,
      // Backdate slightly to avoid race conditions with token issuance
      passwordChangedAt: new Date(Date.now() - 1000),
    },
  });

  createSendToken(updatedUser, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  if (!req.body.currentPassword)
    return next(new AppError("Required currentPassword", 400));

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    omit: { password: false },
  });

  const isCorrectPassword = await authService.comparePassword(
    req.body.currentPassword,
    user.password,
  );

  if (!isCorrectPassword) {
    return next(new AppError("Your password is wrong!", 401));
  }

  if (!authService.checkPassword(req.body.password, req.body.passwordConfirm)) {
    return next(new AppError("Passwords do not match!", 400));
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      password: await authService.hashPassword(req.body.password),
      passwordChangedAt: new Date(Date.now() - 1000),
    },
  });

  createSendToken(updatedUser, 200, res);
});
