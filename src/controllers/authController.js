// server/src/controllers/authController.js
import User from "../models/User.js";
import admin from "../config/firebaseAdmin.js"; // <-- এটা ঠিক আছে
import { generateToken } from "../utils/generateToken.js";

// Firebase দিয়ে লগইন + রেজিস্টার (একই রাউট)
export const firebaseAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Firebase ID Token verify করা
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // ইউজার খুঁজে দেখা
    let user = await User.findOne({ email });

    if (!user) {
      // নতুন ইউজার হলে তৈরি করা
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        photo: picture || "https://i.ibb.co/4p0Z1Kv/default-avatar.png",
        role: email === "admin@publicinfra.com" ? "admin" : "citizen", // তোমার এডমিন ইমেইল
        isPremium: false,
      });
    }

    // JWT টোকেন তৈরি করে httpOnly cookie-তে পাঠানো
    const token = generateToken(user._id);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000, // ৩০ দিন
    });

    // ক্লায়েন্টে ইউজার ডেটা পাঠানো
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        photo: user.photo,
        role: user.role,
        isPremium: user.isPremium || false,
      },
    });
  } catch (error) {
    console.error("Firebase auth error:", error.message);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// লগইন করা ইউজারের ডেটা (protect middleware দিয়ে)
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// লগআউট
export const logoutUser = async (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
};