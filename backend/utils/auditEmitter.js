import EventEmitter from "events";
import prisma from "./prisma.js";

class AuditEmitter extends EventEmitter {}

const auditEmitter = new AuditEmitter();

auditEmitter.on("audit.log", async (data) => {
  try {
    const { propertyId, actorId, event, message, entityType, entityId } = data;

    // We dont await this inside the controllers so it happens in the background
    // However here inside the listener we await the db call to catch errors
    await prisma.activity.create({
      data: {
        propertyId,
        actorId,
        event,
        message,
        entityType,
        entityId,
      },
    });
  } catch (error) {
    // If the audit log fails we simply log the error
    // We do NOT want to crash the app or affect the user ongoing request
    console.error("🔴 [AuditEmitter] Failed to save audit log:", error.message);
  }
});

export default auditEmitter;
