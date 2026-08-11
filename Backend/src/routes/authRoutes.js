import express from "express";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import protectRoute from "../middleware/auth.middleware.js";
import cloudinary from "../lib/cloudinary.js";

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "15d" });
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

export default router;