const Sentiment = require('sentiment');
const Feedback = require('../models/Feedback');
const SentimentMetric = require('../models/SentimentMetric');
const FeedbackSubmissionStatus = require('../models/FeedbackSubmissionStatus');
const Course = require('../models/Course');

const sentimentAnalyzer = new Sentiment();

const classifySentiment = (comment) => {
  if (!comment || !comment.trim()) return 'Neutral';
  const result = sentimentAnalyzer.analyze(comment);
  if (result.score > 1) return 'Positive';
  if (result.score < -1) return 'Negative';
  return 'Neutral';
};

// Helper to update aggregated sentiment metrics
const updateSentimentMetrics = async (courseId, rating, sentimentLabel) => {
  const metric =
    (await SentimentMetric.findOne({ course: courseId })) ||
    new SentimentMetric({ course: courseId });

  metric.feedbackCount += 1;
  // Increment sentiment buckets
  if (sentimentLabel === 'Positive') metric.positiveCount += 1;
  if (sentimentLabel === 'Neutral') metric.neutralCount += 1;
  if (sentimentLabel === 'Negative') metric.negativeCount += 1;

  // Recompute average rating
  const totalRating = metric.averageRating * (metric.feedbackCount - 1) + rating;
  metric.averageRating = totalRating / metric.feedbackCount;
  metric.lastUpdatedAt = new Date();

  await metric.save();
  return metric;
};

// POST /api/feedback
// Authenticated student feedback with anonymity bridge (one submission per course per student)
const submitFeedback = async (req, res) => {
  try {
    const { courseId, rating, comment } = req.body;

    if (!courseId || !rating) {
      return res.status(400).json({ message: 'Course and rating are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Enforce "one feedback per student per course" without linking
    const existingStatus = await FeedbackSubmissionStatus.findOne({
      student: req.user._id,
      course: courseId,
    });
    if (existingStatus) {
      return res.status(409).json({ message: 'You have already submitted feedback for this course' });
    }

    const sentimentLabel = classifySentiment(comment);

    const feedback = await Feedback.create({
      course: courseId,
      rating,
      comment,
      sentiment: sentimentLabel,
    });

    // Create submission status record after successful feedback creation
    await FeedbackSubmissionStatus.create({
      student: req.user._id,
      course: courseId,
    });

    const metrics = await updateSentimentMetrics(courseId, rating, sentimentLabel);

    // Emit real-time event to faculty dashboards via Socket.io
    const io = req.app.get('io');
    io.to(courseId.toString()).emit('feedback:new', {
      courseId,
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        comment: feedback.comment,
        sentiment: feedback.sentiment,
        createdAt: feedback.createdAt,
      },
      metrics,
    });

    return res.status(201).json({ feedback, metrics });
  } catch (error) {
    console.error('submitFeedback error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/feedback/public
// Public "quick feedback" without login (no per-student deduplication)
const submitPublicFeedback = async (req, res) => {
  try {
    const { courseCode, rating, comment } = req.body;
    if (!courseCode || !rating) {
      return res.status(400).json({ message: 'Course code and rating are required' });
    }

    const course = await Course.findOne({ code: courseCode.toUpperCase() });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const sentimentLabel = classifySentiment(comment);

    const feedback = await Feedback.create({
      course: course._id,
      rating,
      comment,
      sentiment: sentimentLabel,
    });

    const metrics = await updateSentimentMetrics(course._id, rating, sentimentLabel);

    const io = req.app.get('io');
    io.to(course._id.toString()).emit('feedback:new', {
      courseId: course._id,
      feedback: {
        id: feedback._id,
        rating: feedback.rating,
        comment: feedback.comment,
        sentiment: feedback.sentiment,
        createdAt: feedback.createdAt,
      },
      metrics,
    });

    return res.status(201).json({ feedback, metrics });
  } catch (error) {
    console.error('submitPublicFeedback error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/feedback/course/:courseId
// Faculty can view feedback for their own course
const getCourseFeedback = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Ensure only faculty who owns the course or admin can view
    if (req.user.role === 'Faculty' && course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: not your course' });
    }

    const feedback = await Feedback.find({ course: courseId }).sort({ createdAt: -1 });
    const metrics = await SentimentMetric.findOne({ course: courseId });

    return res.json({ feedback, metrics });
  } catch (error) {
    console.error('getCourseFeedback error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  submitFeedback,
  submitPublicFeedback,
  getCourseFeedback,
};

