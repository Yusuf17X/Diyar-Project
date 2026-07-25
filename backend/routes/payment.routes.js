import express from "express";
import * as paymentController from "../controllers/payment.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router.post("/payment-session", paymentController.createPaymentSession);

router.post(
  "/cash",
  authController.restrictTo("ADMIN", "SUPER_ADMIN"),
  paymentController.createCashPayment,
);

export default router;
