import * as factory from "./handlerFactory.js";

export const getAllUnits = factory.getAll("unit");
export const getUnit = factory.getOne("unit");

export const createUnit = factory.createOne("unit");
export const updateUnit = factory.updateOne("unit");
export const deleteUnit = factory.deleteOne("unit");

