import * as factory from "./handlerFactory.js";

export const getAllAssignments = factory.getAll("residentUnitAssignment", {
  include: { unit: true, property: true },
});

export const getAssignment = factory.getOne("residentUnitAssignment", {
  include: { unit: true, property: true },
});

const writableAssignmentFields = [
  "propertyId",
  "userId",
  "unitId",
  "occupancyType",
  "isBillingResponsible",
  "startsAt",
  "endsAt",
  "isCurrent",
];

export const createAssignment = factory.createOne("residentUnitAssignment", {
  allowedFields: writableAssignmentFields,
});
export const updateAssignment = factory.updateOne("residentUnitAssignment", {
  allowedFields: writableAssignmentFields,
});
export const deleteAssignment = factory.deleteOne("residentUnitAssignment");
