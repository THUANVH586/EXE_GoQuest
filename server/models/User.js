const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    displayName: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'staff'],
        default: 'user'
    },
    completedTasks: [{
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        completedAt: {
            type: Date,
            default: Date.now
        }
    }],
    activeMissions: [{
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        startTime: {
            type: Date,
            default: Date.now
        },
        expiresAt: {
            type: Date
        },
        status: {
            type: String,
            enum: ['started', 'completed', 'expired'],
            default: 'started'
        }
    }],
    longTermProgress: {
        steps: {
            type: Number,
            default: 0
        },
        distance: {
            type: Number,
            default: 0
        },
        usingPersonalBottle: {
            type: Boolean,
            default: false
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
