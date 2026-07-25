import express from "express";
import * as ticketController from "../controllers/ticket.controller.js";
import * as authController from "../controllers/auth.controller.js";
import upload from "../utils/upload.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(ticketController.getAllTickets)
  .post(
    upload.array("images", 5),
    ticketController.uploadTicketImages,
    ticketController.createTicket,
  );

router
  .route("/:id")
  .get(ticketController.getTicket)
  .patch(ticketController.updateTicket)
  .delete(ticketController.deleteTicket);

export default router;
