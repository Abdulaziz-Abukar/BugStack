const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  host: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  // issues Schema reference in an array
  // eventual feature: updatedAt -> creates a date for updated time
});

module.exports = mongoose.model("Project", projectSchema);
