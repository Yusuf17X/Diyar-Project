import express from "express";
import * as propertyController from "../controllers/property.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(propertyController.getAllProperties)
  .post(
    authController.restrictTo("SUPER_ADMIN"),
    propertyController.createProperty,
  );

router
  .route("/:id")
  .get(propertyController.getProperty)
  .patch(
    authController.restrictTo("SUPER_ADMIN"),
    propertyController.updateProperty,
  )
  .delete(
    authController.restrictTo("SUPER_ADMIN"),
    propertyController.deleteProperty,
  );

export default router;
