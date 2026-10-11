
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const customerAuth = require("../middleware/customerAuth");

const router = express.Router();

router.use(customerAuth);

function publicProfile(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

// GET CUSTOMER PROFILE
router.get("/me", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.userId)) {
      return res.status(401).json({
        message: "Invalid customer session. Please login again.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json({ user: publicProfile(user) });
  } catch (error) {
    console.error("Get profile error:", error.message);
    res.status(500).json({
      message: "Failed to load profile",
    });
  }
});

// UPDATE CUSTOMER PROFILE
router.put("/me", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.userId)) {
      return res.status(401).json({
        message: "Invalid customer session. Please login again.",
      });
    }

    const fullName =
      typeof req.body.fullName === "string"
        ? req.body.fullName.trim()
        : "";

    const email =
      typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const phone =
      typeof req.body.phone === "string"
        ? req.body.phone.trim()
        : "";

    if (!fullName || !email || !phone) {
      return res.status(400).json({
        message: "Name, email and phone are required",
      });
    }

    if (fullName.length > 100) {
      return res.status(400).json({
        message: "Name must be 100 characters or fewer",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Enter a valid email address",
      });
    }

    if (phone.length < 7 || phone.length > 20) {
      return res.status(400).json({
        message: "Enter a valid phone number",
      });
    }

    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.userId },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "This email is already used by another account",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { fullName, email, phone } },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json({
      message: "Profile updated successfully",
      user: publicProfile(user),
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This email is already registered",
      });
    }

    res.status(500).json({
      message: "Failed to update profile",
    });
  }
});


router.put("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "Please fill all password fields",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: "New password must be different from current password",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.json({
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      message: "Failed to update password",
    });
  }
});

module.exports = router;
