const express = require('express');
const { submitConfusion, getCourseConfusion } = require('../controllers/confusionController');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();

// Public/Student can submit confusion (no auth strictly required for quick access, but courseId needed)
// If we want rigorous check, we can use authRequired. For "Live" feel, maybe keep it open or auth if student logged in.
// Requirement says "Student clicks", so let's assume they are logged in or using quick link.
// Let's use authRequired for now as per "Student Dashboard" feature.
router.post('/', authRequired, requireRole('Student'), submitConfusion);

// Faculty views confusion
router.get('/course/:courseId', authRequired, requireRole('Faculty', 'Admin'), getCourseConfusion);

module.exports = router;
