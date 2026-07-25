import * as factory from "./handlerFactory.js";

export const getAllAssignments = factory.getAll("residentUnitAssignment", {
  include: { unit: true, property: true },
});

export const getAssignment = factory.getOne("residentUnitAssignment", {
  include: { unit: true, property: true },
});

export const createAssignment = factory.createOne("residentUnitAssignment");
export const updateAssignment = factory.updateOne("residentUnitAssignment");
export const deleteAssignment = factory.deleteOne("residentUnitAssignment");



