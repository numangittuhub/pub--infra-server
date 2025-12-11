// src/models/Issue.js
import mongoose from "mongoose";

const timelineSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "in-progress", "working", "resolved", "closed", "rejected"],
    required: true,
  },
  message: { type: String },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  byRole: { type: String, enum: ["citizen", "staff", "admin"] },
  timestamp: { type: Date, default: Date.now },
});

const issueSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true }, // Road, Water, Light, Garbage etc.
  location: { type: String, required: true },
  images: [{ type: String }], // Cloudinary URLs

  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // staff

  status: {
    type: String,
    enum: ["pending", "in-progress", "working", "resolved", "closed", "rejected"],
    default: "pending",
  },
  priority: {
    type: String,
    enum: ["normal", "high"],
    default: "normal",
  },

  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // যারা আপভোট করেছে
  isBoosted: { type: Boolean, default: false },
  boostedAt: { type: Date },

  timeline: [timelineSchema], // অডিট হিস্ট্রি

}, { timestamps: true });

// Virtual for upvote count
issueSchema.virtual("upvoteCount").get(function () {
  return this.upvotes.length;
});

// Index for fast sorting
issueSchema.index({ priority: -1, createdAt: -1 }); // boosted = high first
issueSchema.index({ reportedBy: 1 });

export default mongoose.model("Issue", issueSchema);