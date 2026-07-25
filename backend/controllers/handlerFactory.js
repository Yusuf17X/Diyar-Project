import AppError from "./../utils/appError.js";
import catchAsync from "./../utils/catchAsync.js";
import PrismaQueryBuilder from "../utils/prismaQueryBuilder.js";
import prisma from "../utils/prisma.js";
import auditEmitter from "../utils/auditEmitter.js";

// Map Prisma model names to our Activity Schema enum `EntityTypes`
const getAuditEntityType = (modelName) => {
  const map = {
    user: "USER",
    unit: "UNIT",
    announcement: "ANNOUNCEMENT",
    visitorPass: "VISITOR_PASS",
    maintenanceTicket: "TICKET",
    payment: "PAYMENT",
    invoice: "INVOICE",
    residentUnitAssignment: "RESIDENT_ASSIGNMENT",
    securityLog: "SECURITY_LOG",
    property: "PROPERTY",
  };
  return map[modelName] || null;
};

export const deleteOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const { enforcePropertyId = true, userField = "userId" } = options;

    // Build baseFilter to restrict records based on user role and property
    const baseFilter = {};
    if (req.user) {
      if (req.user.role === "SUPER_ADMIN") {
        // Access everything
      } else if (req.user.role === "ADMIN") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      } else if (req.user.role === "RESIDENT") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
        if (Model === "user") {
          baseFilter.id = req.user.id;
        } else {
          baseFilter[userField] = req.user.id;
        }
      } else {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      }
    }

    const existingRecord = await prisma[Model].findFirst({
      where: { id: req.params.id, ...baseFilter },
    });

    if (!existingRecord)
      return next(new AppError("No record with that ID!", 404));

    // Delete the matching record by id
    await prisma[Model].delete({
      where: { id: req.params.id },
    });

    if (req.user && req.user.propertyId) {
      const entityType = getAuditEntityType(Model);
      if (entityType) {
        auditEmitter.emit("audit.log", {
          propertyId: req.user.propertyId,
          actorId: req.user.id,
          event: `${entityType}_DELETED`,
          entityType,
          entityId: req.params.id,
          message: `${entityType} record was deleted.`,
        });
      }
    }

    res.status(204).end();
  });

export const updateOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const { enforcePropertyId = true, userField = "userId" } = options;

    // Build baseFilter to restrict records based on user role and property
    const baseFilter = {};
    if (req.user) {
      if (req.user.role === "SUPER_ADMIN") {
        // Access everything
      } else if (req.user.role === "ADMIN") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      } else if (req.user.role === "RESIDENT") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
        if (Model === "user") {
          baseFilter.id = req.user.id;
        } else {
          baseFilter[userField] = req.user.id;
        }
      } else {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      }
    }

    const existingRecord = await prisma[Model].findFirst({
      where: { id: req.params.id, ...baseFilter },
    });

    if (!existingRecord)
      return next(new AppError("No record with that ID!", 404));

    // Update record with provided body data
    const updatedRecord = await prisma[Model].update({
      where: { id: req.params.id },
      data: req.body,
    });

    if (req.user && req.user.propertyId) {
      const entityType = getAuditEntityType(Model);
      if (entityType) {
        auditEmitter.emit("audit.log", {
          propertyId: req.user.propertyId,
          actorId: req.user.id,
          event: `${entityType}_UPDATED`,
          entityType,
          entityId: req.params.id,
          message: `${entityType} record was updated.`,
        });
      }
    }

    res.status(200).json({ status: "success", data: { updatedRecord } });
  });

export const createOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    if (!req.body) return next(new AppError("Please provide some data!", 400));

    const { enforcePropertyId = true, userField = "userId" } = options;

    if (req.user) {
      if (req.user.role === "RESIDENT") {
        if (!req.body[userField] && Model !== "user") {
          req.body[userField] = req.user.id;
        }
      }
      if (
        enforcePropertyId &&
        req.user.propertyId &&
        !req.body.propertyId &&
        Model !== "property"
      ) {
        req.body.propertyId = req.user.propertyId;
      }
    }

    const newRecord = await prisma[Model].create({
      data: req.body,
    });

    if (req.user && req.user.propertyId) {
      const entityType = getAuditEntityType(Model);
      if (entityType) {
        auditEmitter.emit("audit.log", {
          propertyId: req.user.propertyId,
          actorId: req.user.id,
          event: `${entityType}_CREATED`,
          entityType,
          entityId: newRecord.id,
          message: `A new ${entityType} was created.`,
        });
      }
    }

    res.status(201).json({
      status: "success",
      data: {
        data: newRecord,
      },
    });
  });

export const getOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const {
      include = null,
      enforcePropertyId = true,
      userField = "userId",
    } = options;

    const baseFilter = {};
    if (req.user) {
      if (req.user.role === "SUPER_ADMIN") {
        // Access everything
      } else if (req.user.role === "ADMIN") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      } else if (req.user.role === "RESIDENT") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
        if (Model === "user") {
          baseFilter.id = req.user.id;
        } else {
          baseFilter[userField] = req.user.id;
        }
      } else {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      }
    }

    const record = await prisma[Model].findFirst({
      where: { id: req.params.id, ...baseFilter },
      ...(include ? { include } : {}),
    });

    if (!record) return next(new AppError("No record with that ID!", 404));

    res.status(200).json({ status: "success", data: { record } });
  });

export const getAll = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const querySource = req.queryOverrides || req.query;
    const {
      enforcePropertyId = true,
      userField = "userId",
      nestedFilters = {},
      include = null,
    } = options;

    const builder = new PrismaQueryBuilder(querySource)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const prismaArgs = builder.build();

    const baseFilter = {};
    if (req.user) {
      if (req.user.role === "SUPER_ADMIN") {
        // Access everything
      } else if (req.user.role === "ADMIN") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      } else if (req.user.role === "RESIDENT") {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
        if (Model === "user") {
          baseFilter.id = req.user.id;
        } else {
          baseFilter[userField] = req.user.id;
        }
      } else {
        if (enforcePropertyId && req.user.propertyId) {
          baseFilter.propertyId = req.user.propertyId;
        }
      }
    }

    Object.entries(nestedFilters).forEach(([paramName, fieldName]) => {
      if (req.params[paramName]) baseFilter[fieldName] = req.params[paramName];
    });

    prismaArgs.where = {
      ...(prismaArgs.where || {}),
      ...baseFilter,
    };

    if (include) prismaArgs.include = include;

    const records = await prisma[Model].findMany(prismaArgs);
    const totalRecords = await prisma[Model].count({ where: prismaArgs.where });

    res.status(200).json({
      status: "success",
      results: records.length,
      total: totalRecords,
      data: { data: records },
    });
  });
