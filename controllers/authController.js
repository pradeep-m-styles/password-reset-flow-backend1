const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendResetEmail } = require("../utils/sendEmail");

// ─────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Create user (password hashed via pre-save hook in model)
    const user = await User.create({ name, email, password });

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// @desc    Send password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
// ─────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Step 1: Check if user exists in DB
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Step 2: Generate a random unique token (UUID)
    const resetToken = uuidv4();

    // Step 3: Set expiry time (default 15 minutes)
    const expiryMinutes = parseInt(process.env.RESET_TOKEN_EXPIRY) || 15;
    const resetTokenExpiry = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Step 4: Store the token and expiry in DB
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Step 5: Build the reset link
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Step 6: Send email with the reset link
    await sendResetEmail(email, resetLink);

    res.status(200).json({
      message: "Password reset link has been sent to your email",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Failed to send reset email. Please try again." });
  }
};

// ─────────────────────────────────────────────
// @desc    Verify reset token is valid
// @route   GET /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────
const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Step 1: Find user with this token in DB
    const user = await User.findOne({ resetToken: token });

    // Step 2: If no user found, token is invalid
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    // Step 3: Check if token has expired
    if (user.resetTokenExpiry < Date.now()) {
      // Clear expired token from DB
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        message: "Reset link has expired. Please request a new one.",
        expired: true,
      });
    }

    // Token is valid
    res.status(200).json({ message: "Token is valid", email: user.email });
  } catch (error) {
    console.error("Verify Token Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

// ─────────────────────────────────────────────
// @desc    Reset the password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
// ─────────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Step 1: Find user with this token in DB
    const user = await User.findOne({ resetToken: token });

    // Step 2: Token not found - invalid link
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset link" });
    }

    // Step 3: Check if random string (token) matches with existing in DB
    if (user.resetToken !== token) {
      return res.status(400).json({ message: "Token does not match. Access denied." });
    }

    // Step 4: Check if token has expired
    if (user.resetTokenExpiry < Date.now()) {
      // Clear expired token
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save({ validateBeforeSave: false });

      return res.status(400).json({
        message: "Reset link has expired. Please request a new one.",
        expired: true,
      });
    }

    // Step 5: Update the password (will be hashed via pre-save hook)
    user.password = password;

    // Step 6: Clear the reset token from DB after successful reset
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully. Please login." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error. Please try again." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  verifyResetToken,
  resetPassword,
};
