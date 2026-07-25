import express from "express";
import * as assignmentController from "../controllers/assignment.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(assignmentController.getAllAssignments)
  .post(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    assignmentController.createAssignment,
  );

router
  .route("/:id")
  .get(assignmentController.getAssignment)
  .patch(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    assignmentController.updateAssignment,
  )
  .delete(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    assignmentController.deleteAssignment,
  );

export default router;
