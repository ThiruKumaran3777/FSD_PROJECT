const Confusion = require('../models/Confusion');
const Course = require('../models/Course');

// POST /api/confusion
// Student signals confusion
const submitConfusion = async (req, res) => {
    try {
        const { courseId } = req.body;

        // Optional: Rate limit per student/IP if needed, but basic implementation for now
        const confusion = await Confusion.create({
            course: courseId,
        });

        // Real-time emit
        const io = req.app.get('io');
        io.to(courseId.toString()).emit('confusion:new', {
            courseId,
            timestamp: confusion.timestamp,
        });

        return res.status(201).json({ status: 'ok' });
    } catch (error) {
        console.error('submitConfusion error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// GET /api/confusion/course/:courseId
// Faculty gets recent confusion data (e.g., last 1 hour or specific window)
const getCourseConfusion = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { since } = req.query; // Optional timestamp

        const query = { course: courseId };
        if (since) {
            query.timestamp = { $gt: new Date(since) };
        } else {
            // Default: Last 1 hour only to keep graph relevant to live lecture
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            query.timestamp = { $gt: oneHourAgo };
        }

        const confusions = await Confusion.find(query).sort({ timestamp: 1 });

        return res.json({ confusions });
    } catch (error) {
        console.error('getCourseConfusion error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    submitConfusion,
    getCourseConfusion,
};
