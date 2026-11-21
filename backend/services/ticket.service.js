import prisma from "../utils/prisma.js";
import AppError from "../utils/appError.js";
import auditEmitter from "../utils/auditEmitter.js";

export const handleUpdateTicket = async ({ id, body, user }) => {
  const ticket = await prisma.maintenanceTicket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new AppError("Ticket not found", 404);
  }

  if (user.role === "RESIDENT" && ticket.userId === user.id) {
    if (ticket.status === "IN_PROGRESS") {
      throw new AppError("Cannot update a ticket that is in progress", 400);
    }

    if (
      body.status &&
      body.status === "CANCELLED" &&
      ticket.status !== "SUBMITTED"
    ) {
      throw new AppError("Only SUBMITTED tickets can be cancelled", 400);
    }

    if (body.status && body.status !== "CANCELLED") {
      throw new AppError("Residents can only set status to CANCELLED!", 400);
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        description: body.description || ticket.description,
        priority: body.priority || ticket.priority,
        status: body.status || ticket.status,
      },
    });

    if (body.status === "CANCELLED" && ticket.status !== "CANCELLED") {
      auditEmitter.emit("audit.log", {
        propertyId: ticket.propertyId,
        actorId: user.id,
        event: "TICKET_CANCELLED",
        entityType: "TICKET",
        entityId: ticket.id,
        message: `Ticket #${ticket.ticketNumber} was cancelled by resident.`,
      });
    }

    return updatedTicket;
  }

  if (user.role === "MAINTENANCE" && ticket.assignedToId === user.id) {
    if (ticket.status === "RESOLVED") {
      throw new AppError("Cannot update a resolved ticket", 400);
    }

    if (body.status && !["IN_PROGRESS", "RESOLVED"].includes(body.status)) {
      throw new AppError(
        "Maintenance staff can only set status to IN_PROGRESS or RESOLVED!",
        400,
      );
    }

    if (body.status === "RESOLVED" && ticket.status !== "IN_PROGRESS") {
      throw new AppError("Only IN_PROGRESS tickets can be resolved", 400);
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        status: body.status || ticket.status,
        ...(body.status === "RESOLVED" && ticket.status !== "RESOLVED"
          ? { resolvedAt: new Date() }
          : {}),
      },
    });

    if (body.status === "RESOLVED" && ticket.status !== "RESOLVED") {
      auditEmitter.emit("audit.log", {
        propertyId: ticket.propertyId,
        actorId: user.id,
        event: "TICKET_RESOLVED",
        entityType: "TICKET",
        entityId: ticket.id,
        message: `Ticket #${ticket.ticketNumber} was marked as resolved by maintenance.`,
      });
    }

    return updatedTicket;
  }

  if (user.role === "ADMIN") {
    if (body.assignedToId) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: body.assignedToId },
      });

      if (!assignedUser) {
        throw new AppError("Assigned user not found", 404);
      }

      if (assignedUser.role !== "MAINTENANCE") {
        throw new AppError("Assigned user must be maintenance staff", 400);
      }
    }

    const updatedTicket = await prisma.maintenanceTicket.update({
      where: { id },
      data: {
        assignedToId: body.assignedToId,
        status: body.status || ticket.status,
        priority: body.priority || ticket.priority,
        ...(body.status === "RESOLVED" && ticket.status !== "RESOLVED"
          ? { resolvedAt: new Date() }
          : {}),
      },
    });

    if (body.assignedToId && body.assignedToId !== ticket.assignedToId) {
      auditEmitter.emit("audit.log", {
        propertyId: ticket.propertyId,
        actorId: user.id,
        event: "TICKET_ASSIGNED",
        entityType: "TICKET",
        entityId: ticket.id,
        message: `Ticket #${ticket.ticketNumber} was assigned to ${updatedTicket.assignedToId}.`,
      });
    }

    return updatedTicket;
  }

  throw new AppError("Unauthorized to update this ticket", 403);
};
