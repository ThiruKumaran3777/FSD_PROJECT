const express = require('express');
const {
  submitFeedback,
  submitPublicFeedback,
  getCourseFeedback,
} = require('../controllers/feedbackController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Authenticated student feedback with anonymity bridge
router.post('/', authRequired, requireRole('Student'), submitFeedback);

// Public quick feedback (no auth)
router.post('/public', submitPublicFeedback);

// Faculty/Admin get feedback for a course
router.get(
  '/course/:courseId',
  authRequired,
  requireRole('Faculty', 'Admin'),
  getCourseFeedback
);

module.exports = router;

