// server/src/routes/authRoutes.js
import express from "express";
import { firebaseAuth, getMe, logoutUser } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Firebase দিয়ে লগইন + রেজিস্টার (একই রাউট)
router.post("/firebase", firebaseAuth);

// Current user
router.get("/me", protect, getMe);

// Logout
router.post("/logout", logoutUser);

export default router;