const express = require('express');
const {
  createCourse,
  getMyCourses,
  getCourseByCode,
  deleteCourse,
  getCourseRoster,
  removeFromRoster,
} = require('../controllers/courseController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Faculty/Admin create course
router.post('/', authRequired, requireRole('Faculty', 'Admin'), createCourse);

// Faculty get their courses
router.get('/mine', authRequired, requireRole('Faculty'), getMyCourses);

// Delete course
router.delete('/:id', authRequired, requireRole('Faculty', 'Admin'), deleteCourse);

// Roster endpoints
router.get('/:id/roster', authRequired, requireRole('Faculty', 'Admin'), getCourseRoster);
router.delete(
  '/:id/roster/:studentId',
  authRequired,
  requireRole('Faculty', 'Admin'),
  removeFromRoster
);

// Public lookup by course code (for quick feedback links)
router.get('/code/:code', getCourseByCode);

module.exports = router;

