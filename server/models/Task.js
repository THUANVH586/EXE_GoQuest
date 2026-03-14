const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['food', 'craft', 'community', 'health', 'environment'],
        required: true
    },
    category: {
        type: String,
        enum: ['short-term', 'long-term'],
        default: 'short-term'
    },
    location: {
        name: String,
        description: String
    },
    duration: {
        type: Number, // in minutes
        default: 15
    },
    points: {
        type: Number,
        default: 10
    },
    icon: {
        type: String,
        default: '🎯'
    },
    img: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);
