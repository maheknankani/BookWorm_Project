import express from "express";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import protectRoute from "../middleware/auth.middleware.js";
import cloudinary from "../lib/cloudinary.js";
import { sendOtpEmail } from "../lib/nodemailer.js";

const router = express.Router();

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || "default_bookworm_jwt_secret_key_2026";
  return jwt.sign({ userId }, secret, { expiresIn: "15d" });
};

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  profileImage: user.profileImage,
  bio: user.bio || "",
  favoriteGenre: user.favoriteGenre || "",
  readingGoal: user.readingGoal || "",
  createdAt: user.createdAt,
});

router.post("/register", async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      return res.status(400).json({
        message: "Username must be 3-30 characters long and contain only letters, numbers, or underscores",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password should be at least 6 characters long" });
    }

    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const existingUsername = await User.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username.trim())}`;

    const user = new User({
      email: email.trim().toLowerCase(),
      username: username.trim(),
      password,
      profileImage,
      bio: "",
      favoriteGenre: "",
      readingGoal: "",
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Error in register route:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid email or password" });

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Error in login route:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

// Update Profile
router.put("/profile", protectRoute, async (req, res) => {
  try {
    const { username, profileImage, bio, favoriteGenre, readingGoal } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (username && username.trim() !== "") {
      const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
      if (!usernameRegex.test(username.trim())) {
        return res.status(400).json({
          message: "Username must be 3-30 characters long and contain only letters, numbers, or underscores",
        });
      }

      if (username.trim() !== user.username) {
        const existingUsername = await User.findOne({ username: username.trim() });
        if (existingUsername) {
          return res.status(400).json({ message: "Username is already taken" });
        }
        user.username = username.trim();
      }
    }

    if (profileImage && typeof profileImage === "string" && profileImage.trim() !== "") {
      if (profileImage.startsWith("data:")) {
        try {
          const uploadRes = await cloudinary.uploader.upload(profileImage);
          user.profileImage = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error("Profile image upload Cloudinary error:", uploadErr.message);
          user.profileImage = profileImage;
        }
      } else {
        user.profileImage = profileImage;
      }
    }

    if (bio !== undefined && typeof bio === "string") {
      if (bio.trim().length > 250) {
        return res.status(400).json({ message: "Bio cannot exceed 250 characters" });
      }
      user.bio = bio.trim();
    }

    if (favoriteGenre !== undefined && typeof favoriteGenre === "string") {
      if (favoriteGenre.trim().length > 50) {
        return res.status(400).json({ message: "Favorite genre cannot exceed 50 characters" });
      }
      user.favoriteGenre = favoriteGenre.trim();
    }

    if (readingGoal !== undefined && typeof readingGoal === "string") {
      if (readingGoal.trim().length > 50) {
        return res.status(400).json({ message: "Reading goal cannot exceed 50 characters" });
      }
      user.readingGoal = readingGoal.trim();
    }

    await user.save();

    res.json({
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Forgot Password - Step 1: Send OTP
router.post("/forgot-password/send-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email address is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "No account registered with this email address" });
    }

    // Generate 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the OTP with bcrypt for secure storage
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    // Remove any previous OTPs for this email
    await Otp.deleteMany({ email: normalizedEmail });

    // Set expiry time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await Otp.create({
      email: normalizedEmail,
      otp: hashedOtp,
      expiresAt,
    });

    // Send email using Nodemailer
    await sendOtpEmail(normalizedEmail, rawOtp);

    res.status(200).json({
      message: "A 6-digit verification OTP has been sent to your email address.",
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

// Forgot Password - Step 2: Verify OTP
router.post("/forgot-password/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP code are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Find non-expired OTP record
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP. Please request a new OTP." });
    }

    const isValid = await otpRecord.compareOtp(cleanOtp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP code. Please check and try again." });
    }

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP. Please try again." });
  }
});

// Forgot Password - Step 3: Reset Password
router.post("/forgot-password/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP code, and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    // Verify OTP again
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      expiresAt: { $gt: new Date() },
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP session. Please restart the process." });
    }

    const isValid = await otpRecord.compareOtp(cleanOtp);
    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP code" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password (triggering userSchema.pre('save') which hashes with bcrypt)
    user.password = newPassword;
    await user.save();

    // Delete used OTP
    await Otp.deleteMany({ email: normalizedEmail });

    res.status(200).json({ message: "Password reset successful. You can now log in with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
});

export default router;