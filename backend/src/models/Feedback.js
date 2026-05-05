const mongoose = require('mongoose');

// NOTE: Intentionally no student reference here to keep feedback anonymous.

const feedbackSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral',
    },
    pulseSessionId: {
      // Optional: tie feedback to a 5-minute "Pulse Check" session
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PulseSession',
      default: null,
    }
  },
  {
    timestamps: true,
  }
);

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;

