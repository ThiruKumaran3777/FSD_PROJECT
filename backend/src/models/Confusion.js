const mongoose = require('mongoose');

const confusionSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
            index: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true, // For efficient range queries (e.g., "last 1 hour")
        },
    },
    {
        timestamps: true, // Only createdAt is really needed, but standardizing
    }
);

const Confusion = mongoose.model('Confusion', confusionSchema);

module.exports = Confusion;
