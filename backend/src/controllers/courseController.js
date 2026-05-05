const Course = require('../models/Course');
const Feedback = require('../models/Feedback');
const SentimentMetric = require('../models/SentimentMetric');
const FeedbackSubmissionStatus = require('../models/FeedbackSubmissionStatus');

// POST /api/courses
// Faculty (or Admin) creates a course
const createCourse = async (req, res) => {
  try {
    const { title, code } = req.body;
    if (!title || !code) {
      return res.status(400).json({ message: 'Title and code are required' });
    }

    const existing = await Course.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(409).json({ message: 'Course code already exists' });
    }

    const course = await Course.create({
      title,
      code,
      faculty: req.user._id,
    });

    return res.status(201).json({ course });
  } catch (error) {
    console.error('createCourse error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/courses/mine (faculty)
const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ faculty: req.user._id }).sort({ createdAt: -1 });
    return res.json({ courses });
  } catch (error) {
    console.error('getMyCourses error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/courses/code/:code - used for student quick feedback links
const getCourseByCode = async (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const course = await Course.findOne({ code }).populate('faculty', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    return res.json({ course });
  } catch (error) {
    console.error('getCourseByCode error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/courses/:id
// Faculty can delete their own course; Admin can delete any course
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isOwner = course.faculty.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: not allowed to delete this course' });
    }

    await Feedback.deleteMany({ course: id });
    await SentimentMetric.deleteMany({ course: id });
    await FeedbackSubmissionStatus.deleteMany({ course: id });
    await course.deleteOne();

    return res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('deleteCourse error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/courses/:id/roster
// Roster is derived from students who have submitted feedback for this course
const getCourseRoster = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isOwner = course.faculty.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: not your course' });
    }

    const roster = await FeedbackSubmissionStatus.find({ course: id })
      .populate('student', 'name email role')
      .sort({ createdAt: -1 });

    return res.json({
      roster: roster.map((r) => ({
        id: r.student._id,
        name: r.student.name,
        email: r.student.email,
        role: r.student.role,
        lastActivity: r.updatedAt,
      })),
    });
  } catch (error) {
    console.error('getCourseRoster error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// DELETE /api/courses/:id/roster/:studentId
// Remove a student from the "roster" by removing their submission status
const removeFromRoster = async (req, res) => {
  try {
    const { id, studentId } = req.params;
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isOwner = course.faculty.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden: not your course' });
    }

    await FeedbackSubmissionStatus.deleteMany({ course: id, student: studentId });
    return res.json({ message: 'Student removed from roster' });
  } catch (error) {
    console.error('removeFromRoster error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createCourse,
  getMyCourses,
  getCourseByCode,
  deleteCourse,
  getCourseRoster,
  removeFromRoster,
};

