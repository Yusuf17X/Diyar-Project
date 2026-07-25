import express from "express";
import rateLimit from "express-rate-limit";
import * as authController from "../controllers/auth.controller.js";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

const authLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP. Please try again in an hour!",
});

router.post("/signup", authController.signup);
router.post("/login", authLimiter, authController.login);

//* To change user password there is 2 steps
// 1. post to this route with only email
router.post("/forgot-password", authLimiter, authController.forgotPassword);
// 2. post to this route with some token and the new password
router.patch("/reset-password/:token", authController.resetPassword);

router.use(authController.protect);

// Update password without having to forget it :)
router.patch("/update-my-password", authController.updatePassword);

router.get("/me", userController.getMe, userController.getUser);

router.use(authController.restrictTo("ADMIN", "SUPER_ADMIN"));

router
  .route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
