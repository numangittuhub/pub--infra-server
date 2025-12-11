// src/controllers/.js
import Issue from "../models/Issue.js";
import User from "../models/User.js";
import { ISSUE_STATUS from "../constants/index.js";

// Create Issue
export const createIssue = async (req, res) => {
  const { title, description, category, location } = req.body;
  const images = req.files?.map(file => file.path); // Cloudinary URLs

  const user = await User.findById(req.user._id);
  if (user.isBlocked) return res.status(403).json({ message: "You are blocked" });

  if (!user.isPremium && user.reportedIssuesCount >= 3) {
    return res.status(403).json({ message: "Free limit reached. Subscribe to premium." });
  }

  const issue = await Issue.create({
    title,
    description,
    category,
    location,
    images,
    reportedBy: req.user._id,
    timeline: [{
      status: "pending",
      message: "Issue reported by citizen",
      by: req.user._id,
      byRole: req.user.role,
    }],
  });

  // Increase count
  user.reportedIssuesCount += 1;
  await user.save();

  res.status(201).json(issue);
};

// Get All Issues (with search, filter, pagination)
export const getAllIssues = async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const { search, category, status, priority } = req.query;

  let query = {};

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
    ];
  }
  if (category) query.category = category;
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const issues = await Issue.find(query)
    .populate("reportedBy", "name photo")
    .populate("assignedTo", "name")
    .sort({ priority: -1, createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Issue.countDocuments(query);

  res.json({
    issues,
    pagination: {
      current: page,
      pages: Math.ceil(total / limit),
      total,
    },
  });
};

// Get Single Issue
export const getIssueById = async (req, res) => {
  const issue = await Issue.findById(req.params.id)
    .populate("reportedBy", "name photo")
    .populate("assignedTo", "name")
    .populate("timeline.by", "name photo");

  if (!issue) return res.status(404).json({ message: "Issue not found" });

  res.json(issue);
};

// Upvote Issue
export const upvoteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) return res.status(404).json({ message: "Issue not found" });

  if (issue.reportedBy.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: "Cannot upvote own issue" });
  }

  if (issue.upvotes.includes(req.user._id)) {
    return res.status(400).json({ message: "Already upvoted" });
  }

  issue.upvotes.push(req.user._id);
  await issue.save();

  res.json({ message: "Upvoted", upvoteCount: issue.upvotes.length });
};

// Boost Issue (Payment পরে যোগ হবে)
export const boostIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) return res.status(404).json({ message: "Issue not found" });
  if (issue.reportedBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized" });
  }
  if (issue.isBoosted) return res.status(400).json({ message: "Already boosted" });

  // পরে Stripe webhook এ এটা true করব
  issue.priority = "high";
  issue.isBoosted = true;
  issue.boostedAt = new Date();

  issue.timeline.push({
    status: "pending",
    message: "Issue boosted to HIGH priority (Paid ৳100)",
    by: req.user._id,
    byRole: "citizen",
  });

  await issue.save();
  res.json({ message: "Issue boosted successfully!" });
};