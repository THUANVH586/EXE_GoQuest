const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
