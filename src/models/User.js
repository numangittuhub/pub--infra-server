// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // staff হলে থাকবে, citizen/google login হলে null
  photo: { type: String, default: "https://i.ibb.co.com/4p0Z1Kv/default-avatar.png" },
  role: { 
    type: String, 
    enum: ["citizen", "staff", "admin"], 
    default: "citizen" 
  },
  isPremium: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  reportedIssuesCount: { type: Number, default: 0 },
}, { timestamps: true });

// Password hash before save (only for email/password users)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("User", userSchema);

//....................