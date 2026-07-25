import express from "express";
import * as dashboardController from "../controllers/dashboard.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(
  authController.protect,
  authController.restrictTo("ADMIN", "SUPER_ADMIN"),
);
router.use(dashboardController.attachScope);

router.get("/summary", dashboardController.getSummary);
router.get("/billing-summary", dashboardController.getBillingSummary);
router.get("/maintenance-trends", dashboardController.getMaintenanceTrends);

export default router;
