const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    budgetedAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    period: {
      type: String,
      enum: [
        "weekly",
        "monthly",
        "quarterly",
        "yearly",
      ],
      default: "monthly",
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    alertThreshold: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    color: {
      type: String,
    },

    description: {
      type: String,
    },

    tags: {
      type: [String],
      default: [],
    },

    rollover: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Budget",
  budgetSchema
);