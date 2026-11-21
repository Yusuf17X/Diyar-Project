import * as factory from "./handlerFactory.js";

export const getSecurityLogs = factory.getAll("securityLog");
export const getSecurityLog = factory.getOne("securityLog");
const writableSecurityLogFields = [
  "propertyId",
  "passId",
  "eventType",
  "details",
  "occurredAt",
];

export const updateSecurityLog = factory.updateOne("securityLog", {
  allowedFields: writableSecurityLogFields,
});
export const deleteSecurityLog = factory.deleteOne("securityLog");
export const createSecurityLog = factory.createOne("securityLog", {
  allowedFields: [...writableSecurityLogFields, "actorId"],
});
