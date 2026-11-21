import prisma from "../utils/prisma.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import * as factory from "./handlerFactory.js";

export const generateVisitorPass = catchAsync(async (req, res, next) => {
  const { unitId, guestName, visitDate, purpose } = req.body;

  if (!unitId || !guestName || !visitDate) {
    return next(
      new AppError("Please provide unitId, guestName, and visitDate!", 400),
    );
  }

  const unit = await prisma.unit.findUnique({ where: { id: unitId } });

  if (!unit) {
    return next(new AppError("Unit not found", 404));
  }

  if (unit.propertyId !== req.user.propertyId) {
    return next(new AppError("Unit does not belong to your property", 403));
  }

  if (req.user.role === "RESIDENT") {
    const assignment = await prisma.residentUnitAssignment.findFirst({
      where: {
        userId: req.user.id,
        unitId,
        propertyId: req.user.propertyId,
        isCurrent: true,
      },
    });

    if (!assignment) {
      return next(new AppError("You are not assigned to this unit", 403));
    }
  }

  const visitorPass = await prisma.visitorPass.create({
    data: {
      userId: req.user.id,
      unitId,
      propertyId: req.user.propertyId,
      guestName,
      visitDate,
      purpose,
      expiresAt: new Date(new Date(visitDate).getTime() + 24 * 60 * 60 * 1000),
    },
  });

  const qrCode = `${req.protocol}://${req.get("host")}/api/v1/visitor-pass/scan?token=${visitorPass.qrPayload}`;

  res.status(201).json({
    status: "success",
    data: {
      id: visitorPass.id,
      qrCode,
      visitDate: visitorPass.visitDate,
      guestName: visitorPass.guestName,
      purpose: visitorPass.purpose,
    },
  });
});

export const useVisitorPass = catchAsync(async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return next(new AppError("No token provided!", 400));
  }

  if (req.user.role !== "SECURITY") {
    return next(
      new AppError("Only security personnel can use visitor passes!", 403),
    );
  }

  const visitorPass = await prisma.visitorPass.findUnique({
    where: { qrPayload: token },
  });

  if (!visitorPass) {
    return next(new AppError("Invalid QR code!", 401));
  }

  if (
    req.user.role !== "SUPER_ADMIN" &&
    visitorPass.propertyId !== req.user.propertyId
  ) {
    return next(
      new AppError("Visitor pass does not belong to your property", 403),
    );
  }

  if (visitorPass.status !== "ACTIVE") {
    return next(new AppError("Invalid QR code!", 401));
  }

  if (visitorPass.expiresAt < new Date()) {
    await prisma.visitorPass.update({
      where: { qrPayload: token },
      data: { status: "EXPIRED" },
    });

    return next(new AppError("QR code expired!", 401));
  }

  await prisma.visitorPass.update({
    where: { qrPayload: token },
    data: { status: "USED", usedAt: new Date() },
  });

  res.status(200).json({
    status: "success",
    data: {
      message: "Visitor pass used successfully!",
      guestName: visitorPass.guestName,
      unitId: visitorPass.unitId,
    },
  });
});

export const getAllVisitorPasses = factory.getAll("visitorPass", {
  include: {
    user: true,
    unit: true,
    property: true,
  },
});

export const getVisitorPass = factory.getOne("visitorPass", {
  include: {
    user: true,
    unit: true,
    property: true,
  },
});

export const cancelVisitorPass = catchAsync(async (req, res, next) => {
  const visitorPass = await prisma.visitorPass.findUnique({
    where: { id: req.params.id },
  });

  if (!visitorPass) {
    return next(new AppError("Visitor pass not found!", 404));
  }

  if (visitorPass.status !== "ACTIVE") {
    return next(new AppError("Only active passes can be cancelled!", 400));
  }

  if (req.user.id !== visitorPass.userId) {
    return next(
      new AppError("You can only cancel your own visitor passes!", 403),
    );
  }

  await prisma.visitorPass.update({
    where: { id: req.params.id },
    data: { status: "REVOKED", revokedAt: new Date() },
  });

  res.status(200).json({
    status: "success",
    data: {
      message: "Visitor pass revoked successfully!",
    },
  });
});
