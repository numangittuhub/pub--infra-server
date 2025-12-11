// src/routes/
import express from "express";
import {
  createBoostSession,
  createSubscriptionSession,
  stripeWebhook,
  generateInvoice,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/boost", protect, createBoostSession);
router.post("/subscribe", protect, createSubscriptionSession);
router.post("/webhook", express.raw({ type: "application/json" }), stripeWebhook); // raw body
router.get("/invoice", protect, generateInvoice);

export default router;