// src/controllers/.js
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { getAuth } from "firebase-admin/auth";
import admin from "../config/firebaseAdmin.js"; // পরে তৈরি করব

// Register (called from frontend after Firebase email/password)
export const registerUser = async (req, res) => {
  const { name, email, photo } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    // Already registered → just login
    const token = generateToken(userExists._id);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return res.status(200).json({
      user: {
        _id: userExists._id,
        name: userExists.name,
        email: userExists.email,
        photo: userExists.photo,
        role: userExists.role,
        isPremium: userExists.isPremium,
      },
    });
  }

  const user = await User.create({
    name,
    email,
    photo: photo || "https://i.ibb.co.com/4p0Z1Kv/default-avatar.png",
  });

  const token = generateToken(user._id);
  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      photo: user.photo,
      role: user.role,
      isPremium: user.isPremium,
    },
  });
};

// Get current user (frontend calls this on page load)
export const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

// Logout
export const logoutUser = (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.status(200).json({ message: "Logged out" });
};