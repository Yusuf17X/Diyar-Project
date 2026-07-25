import express from "express";
import * as securityLogsController from "../controllers/securityLogs.controller.js";
import * as authController from "../controllers/auth.controller.js";

const router = express.Router();

router.use(authController.protect);

router.use(authController.restrictTo("SECURITY", "ADMIN", "SUPER_ADMIN"));

router
  .route("/")
  .get(securityLogsController.getSecurityLogs)
  .post(securityLogsController.createSecurityLog);

router
  .route("/:id")
  .get(securityLogsController.getSecurityLog)
  .patch(securityLogsController.updateSecurityLog)
  .delete(securityLogsController.deleteSecurityLog);

export default router;
