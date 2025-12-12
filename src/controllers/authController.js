// server/src/controllers/authController.js
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { getAuth } from "firebase-admin/auth";

// Firebase দিয়ে লগইন/রেজিস্টার (একই রাউট)
export const firebaseAuth = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "No token provided" });
    }

    // Firebase token verify
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: name || email.split("@")[0],
        email,
        photo: picture || "https://i.ibb.co/4p0Z1Kv/default-avatar.png",
        role: email === "admin@publicinfra.com" ? "admin" : "citizen",
      });
    }

    const token = generateToken(user._id);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

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
    console.error("Firebase auth error:", error);
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Current logged in user
export const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// Logout
export const logoutUser = async (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
};