import * as factory from "./handlerFactory.js";

export const getSecurityLogs = factory.getAll("securityLog");
export const getSecurityLog = factory.getOne("securityLog");
export const updateSecurityLog = factory.updateOne("securityLog");
export const deleteSecurityLog = factory.deleteOne("securityLog");
export const createSecurityLog = factory.createOne("securityLog");

