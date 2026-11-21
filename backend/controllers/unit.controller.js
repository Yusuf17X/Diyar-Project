import * as factory from "./handlerFactory.js";

export const getAllUnits = factory.getAll("unit");
export const getUnit = factory.getOne("unit");

const writableUnitFields = ["propertyId", "code", "occupancyStatus"];

export const createUnit = factory.createOne("unit", {
  allowedFields: writableUnitFields,
});
export const updateUnit = factory.updateOne("unit", {
  allowedFields: writableUnitFields,
});
export const deleteUnit = factory.deleteOne("unit");
