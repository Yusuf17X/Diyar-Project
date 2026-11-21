import catchAsync from "./../utils/catchAsync.js";
import prisma from "../utils/prisma.js";
import AppError from "../utils/appError.js";
import * as factory from "./handlerFactory.js";

const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((ele) => {
    if (allowedFields.includes(ele)) newObj[ele] = obj[ele];
  });
  return newObj;
};

export const getMe = catchAsync(async (req, res, next) => {
  req.params.id = req.user.id;

  next();
});

export const getUser = factory.getOne("user", { include: { property: true } });
export const getAllUsers = factory.getAll("user", {
  include: { property: true },
});
const writableUserFields = [
  "name",
  "email",
  "phone",
  "emergencyContact",
  "status",
  "propertyId",
];

export const createUser = factory.createOne("user", {
  allowedFields: writableUserFields,
});
export const updateUser = factory.updateOne("user", {
  allowedFields: [...writableUserFields, "role"],
});
export const deleteUser = factory.deleteOne("user");

export const updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm)
    return next(
      new AppError(
        "This route is not for password updates. please use /update-password",
        400,
      ),
    );

  const filteredBody = filterObject(
    req.body,
    "name",
    "email",
    "phone",
    "emergencyContact",
  );

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: filteredBody,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await prisma.user.update({
    where: { id: req.user.id },
    data: { status: "INACTIVE" },
  });

  res.status(204).end();
});
