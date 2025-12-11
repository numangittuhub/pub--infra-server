// src/app.js
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// === Routes Import ===
import authRoutes from "./routes/authRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
// import issueRoutes from "./routes/issueRoutes.js"; // পরে যোগ করবো

const app = express();

// === Critical: Stripe Webhook এর জন্য raw body (সবার আগে রাখতেই হবে!) ===
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// === অন্যান্য Middleware ===
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json()); // সাধারণ API এর জন্য
app.use(cookieParser());

// === Routes ===
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
// app.use("/api/issues", issueRoutes);

// === Home Route ===
app.get("/", (req, res) => {
  res.json({
    message: "Public Infra API Running Successfully!",
    status: "success",
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/api/auth",
      payments: "/api/payments",
    },
  });
});

// === 404 Handler (সঠিক উপায়ে!) ===
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

export default app;