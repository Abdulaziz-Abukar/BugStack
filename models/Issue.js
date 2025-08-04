const mongoose = require("mongoose");

const issueSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
    default: "OPEN",
    required: true,
  },
  priority: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "LOW",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  // eventual feature: updatedAt -> changes date to updated date
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // who created the issue
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // who is assigned to it (can be multiple people)
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
});

module.exports = mongoose.model("Issue", issueSchema);
