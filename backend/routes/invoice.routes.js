import express from "express";
import * as invoiceController from "../controllers/invoice.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(invoiceController.getAllInvoices)
  .post(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    invoiceController.createInvoice,
  );

router
  .route("/publish")
  .patch(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    invoiceController.publishAllDraftInvoices,
  );

router
  .route("/:id/items")
  .post(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    invoiceController.addInvoiceItem,
  );

router
  .route("/:id/items/:itemId")
  .delete(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    invoiceController.removeInvoiceItem,
  );

router
  .route("/:id")
  .get(invoiceController.getInvoice)
  .patch(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    invoiceController.updateInvoice,
  )
  .delete(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    invoiceController.deleteInvoice,
  );

export default router;
