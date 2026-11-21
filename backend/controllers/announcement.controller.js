import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import prisma from "../utils/prisma.js";
import auditEmitter from "../utils/auditEmitter.js";

export const getAllAnnouncements = factory.getAll("announcement", {
  include: {
    createdByUser: true,
    property: true,
  },
});

export const getAnnouncement = factory.getOne("announcement", {
  include: {
    createdByUser: true,
    property: true,
  },
});

const writableAnnouncementFields = [
  "title",
  "category",
  "message",
  "publishAt",
  "expiresAt",
  "propertyId",
];

export const createAnnouncement = catchAsync(async (req, res, next) => {
  if (!req.body) return next(new AppError("Please provide some data!", 400));

  const data = Object.fromEntries(
    Object.entries(req.body).filter(([field]) =>
      writableAnnouncementFields.includes(field),
    ),
  );
  data.createdByUserId = req.user.id;
  if (req.user.propertyId && !data.propertyId) {
    data.propertyId = req.user.propertyId;
  }

  const newRecord = await prisma.announcement.create({
    data,
  });

  if (req.user && req.user.propertyId) {
    auditEmitter.emit("audit.log", {
      propertyId: req.user.propertyId,
      actorId: req.user.id,
      event: "ANNOUNCEMENT_CREATED",
      entityType: "ANNOUNCEMENT",
      entityId: newRecord.id,
      message: `A new announcement was created.`,
    });
  }

  res.status(201).json({
    status: "success",
    data: { data: newRecord },
  });
});

export const updateAnnouncement = factory.updateOne("announcement", {
  allowedFields: writableAnnouncementFields,
});
export const deleteAnnouncement = factory.deleteOne("announcement");
