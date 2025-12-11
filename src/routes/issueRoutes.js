// src/routes/.js
import express from "express";
import {
  createIssue,
  getAllIssues,
  getIssueById,
  upvoteIssue,
  boostIssue,
} from "../controllers/issueController.js";
import { protect } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js"; // পরের স্টেপে বানাবো

const router = express.Router();

router.post("/", protect, upload.array("images", 5), createIssue);
router.get("/", getAllIssues);
router.get("/:id", getIssueById);
router.post("/:id/upvote", protect, upvoteIssue);
router.post("/:id/boost", protect, boostIssue);

export default router;