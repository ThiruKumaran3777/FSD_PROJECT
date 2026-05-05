const mongoose = require('mongoose');

const sentimentMetricSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    // Aggregated counts for quick charting
    positiveCount: {
      type: Number,
      default: 0,
    },
    neutralCount: {
      type: Number,
      default: 0,
    },
    negativeCount: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    feedbackCount: {
      type: Number,
      default: 0,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    }
  },
  {
    timestamps: true,
  }
);

const SentimentMetric = mongoose.model('SentimentMetric', sentimentMetricSchema);

module.exports = SentimentMetric;

