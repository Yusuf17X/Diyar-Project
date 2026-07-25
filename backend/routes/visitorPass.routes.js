import express from "express";
import * as visitorPassController from "../controllers/visitorPass.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(visitorPassController.getAllVisitorPasses)
  .post(visitorPassController.generateVisitorPass);

router.get("/:id", visitorPassController.getVisitorPass);
router.post(
  "/use",
  authController.restrictTo("SECURITY", "ADMIN", "SUPER_ADMIN"),
  visitorPassController.useVisitorPass,
);

router.patch("/:id/cancel", visitorPassController.cancelVisitorPass);

export default router;
