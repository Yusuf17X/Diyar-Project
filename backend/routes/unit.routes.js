import express from "express";
import * as unitController from "../controllers/unit.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(unitController.getAllUnits)
  .post(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    unitController.createUnit,
  );

router
  .route("/:id")
  .get(unitController.getUnit)
  .patch(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    unitController.updateUnit,
  )
  .delete(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    unitController.deleteUnit,
  );

export default router;
