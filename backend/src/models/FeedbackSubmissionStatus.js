const mongoose = require('mongoose');

// This collection acts as the "anonymity bridge":
// - Tracks whether a given student has already submitted feedback for a course
// - Does NOT store any link to the actual Feedback document

const feedbackSubmissionStatusSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    }
  },
  {
    timestamps: true,
  }
);

feedbackSubmissionStatusSchema.index({ student: 1, course: 1 }, { unique: true });

const FeedbackSubmissionStatus = mongoose.model(
  'FeedbackSubmissionStatus',
  feedbackSubmissionStatusSchema
);

module.exports = FeedbackSubmissionStatus;

