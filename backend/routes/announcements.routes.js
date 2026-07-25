import express from "express";
import * as announcementController from "../controllers/announcement.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router
  .route("/")
  .get(announcementController.getAllAnnouncements)
  .post(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    announcementController.createAnnouncement,
  );

router
  .route("/:id")
  .get(announcementController.getAnnouncement)
  .patch(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    announcementController.updateAnnouncement,
  )
  .delete(
    authController.restrictTo("ADMIN", "SUPER_ADMIN"),
    announcementController.deleteAnnouncement,
  );

export default router;
