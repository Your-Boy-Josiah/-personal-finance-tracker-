// ===============================================================
//  Alert.js
//  Mongoose model for in-app alerts, primarily used to notify
//  users when their spending approaches or breaches a category cap.
// ===============================================================

const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Alert must belong to a user"],
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Alert must reference a category"],
    },
    type: {
      type: String,
      enum: ["warning", "breach"], // warning = 90%, breach = 100%+
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    percentUsed: {
      type: Number,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Alert = mongoose.model("Alert", alertSchema);

module.exports = Alert;