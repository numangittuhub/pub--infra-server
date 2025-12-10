// src/routes/authRoutes.js
import express from "express";
import { registerUser, getMe, logoutUser } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/me", protect, getMe);
router.post("/logout", logoutUser);

export default router;