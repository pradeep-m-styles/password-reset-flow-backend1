const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
} = require("../controllers/authController");

// Register
router.post("/register", registerUser);

// Login
router.post("/login", loginUser);

// Forgot Password - sends reset email
router.post("/forgot-password", forgotPassword);

// Verify Reset Token - checks if token is valid before showing form
router.get("/reset-password/:token", verifyResetToken);

// Reset Password - updates password in DB
router.post("/reset-password/:token", resetPassword);

module.exports = router;
