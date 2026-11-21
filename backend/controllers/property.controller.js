import * as factory from "./handlerFactory.js";

export const getAllProperties = factory.getAll("property");
export const getProperty = factory.getOne("property");

export const createProperty = factory.createOne("property", {
  allowedFields: ["name"],
});
export const updateProperty = factory.updateOne("property", {
  allowedFields: ["name"],
});
export const deleteProperty = factory.deleteOne("property");
