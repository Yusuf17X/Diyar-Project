import express from "express";
import * as residentController from "../controllers/resident.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router.get("/overview", residentController.getResidentOverview);
router.get("/invoices", residentController.getResidentInvoices);

export default router;
