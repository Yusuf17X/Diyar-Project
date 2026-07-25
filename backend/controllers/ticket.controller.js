import * as factory from "./handlerFactory.js";
import catchAsync from "../utils/catchAsync.js";
import AppError from "../utils/appError.js";
import prisma from "../utils/prisma.js";
import supabase from "../utils/supabase.js";
import * as ticketService from "../services/ticket.service.js";
import auditEmitter from "../utils/auditEmitter.js";

export const getAllTickets = catchAsync(async (req, res, next) => {
  const allowedFilters = ["status", "priority"];

  const query = {};

  for (const key of allowedFilters) {
    if (req.query[key]) {
      query[key] = req.query[key];
    }
  }

  if (req.user.role === "RESIDENT") query.userId = req.user.id;

  if (req.user.role === "MAINTENANCE") query.assignedToId = req.user.id;

  const tickets = await prisma.maintenanceTicket.findMany({
    where: query,
  });

  res.status(200).json({
    status: "success",
    results: tickets.length,
    data: {
      tickets,
    },
  });
});

export const getTicket = catchAsync(async (req, res, next) => {
  const query = {};

  if (req.user.role === "RESIDENT") {
    query.userId = req.user.id;
  }

  if (req.user.role === "MAINTENANCE") {
    query.assignedToId = req.user.id;
  }

  const ticket = await prisma.maintenanceTicket.findFirst({
    where: { ...query, id: req.params.id },
  });

  if (!ticket) {
    return next(new AppError("Ticket not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

export const uploadTicketImages = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next();
  }

  const imageUrls = [];

  for (const file of req.files) {
    // Create a unique filename
    const filename = `ticket-${req.user.id}-${Date.now()}-${file.originalname}`;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from("maintenance-tickets")
      .upload(filename, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      return next(new AppError("Error uploading image to Supabase", 500));
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("maintenance-tickets")
      .getPublicUrl(filename);

    imageUrls.push(publicUrlData.publicUrl);
  }

  // Attach imageUrls to req.body so createTicket can use them
  req.body.imageUrls = imageUrls;
  next();
});

export const createTicket = catchAsync(async (req, res, next) => {
  const { title, category, description, priority, imageUrls, unitId } = req.body;

  let resolvedUnitId = unitId;
  if (!resolvedUnitId) {
    if (req.user.role === "RESIDENT") {
      const assignment = await prisma.residentUnitAssignment.findFirst({
        where: { userId: req.user.id, isCurrent: true },
        select: { unitId: true },
      });
      if (!assignment) {
        return next(new AppError("No unit assignment found for your account", 400));
      }
      resolvedUnitId = assignment.unitId;
    } else {
      return next(new AppError("unitId is required", 400));
    }
  }

  const ticket = await prisma.maintenanceTicket.create({
    data: {
      title,
      category,
      description,
      priority,
      imageUrls: imageUrls || [],
      userId: req.user.id,
      unitId: resolvedUnitId,
      propertyId: req.user.propertyId,
    },
  });

  auditEmitter.emit("audit.log", {
    propertyId: ticket.propertyId,
    actorId: req.user.id,
    event: "TICKET_CREATED",
    entityType: "TICKET",
    entityId: ticket.id,
    message: `Ticket #${ticket.ticketNumber} was created by ${req.user.id}.`,
  });

  res.status(201).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

export const updateTicket = catchAsync(async (req, res, next) => {
  const ticket = await ticketService.handleUpdateTicket({
    id: req.params.id,
    body: req.body,
    user: req.user,
  });

  res.status(200).json({
    status: "success",
    data: {
      ticket,
    },
  });
});

export const deleteTicket = factory.deleteOne("maintenanceTicket");

