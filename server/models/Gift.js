const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    pointsRequired: {
        type: Number,
        required: true,
        default: 100
    },
    img: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: '🎁'
    },
    stock: {
        type: Number,
        default: -1 // -1 = unlimited
    },
    isActive: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Gift', giftSchema);
