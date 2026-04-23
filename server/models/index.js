const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Task = require('./Task');
const Gift = require('./Gift');
const VerificationCode = require('./VerificationCode');

// Join Table for Completed Tasks
const UserCompletedTask = sequelize.define('UserCompletedTask', {
    completedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

// Join Table for Active Missions
const UserActiveMission = sequelize.define('UserActiveMission', {
    startTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expiresAt: {
        type: DataTypes.DATE
    },
    status: {
        type: DataTypes.ENUM('started', 'completed', 'expired'),
        defaultValue: 'started'
    }
}, { timestamps: false });

// Join Table for Redeemed Gifts
const UserRedeemedGift = sequelize.define('UserRedeemedGift', {
    giftTitle: {
        type: DataTypes.STRING
    },
    pointsSpent: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    redeemedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, { timestamps: false });

// Associations
User.belongsToMany(Task, { through: UserCompletedTask, as: 'completedTasks' });
Task.belongsToMany(User, { through: UserCompletedTask });

User.belongsToMany(Task, { through: UserActiveMission, as: 'activeMissions' });
Task.belongsToMany(User, { through: UserActiveMission });

User.belongsToMany(Gift, { through: UserRedeemedGift, as: 'redeemedGifts' });
Gift.belongsToMany(User, { through: UserRedeemedGift });

module.exports = {
    sequelize,
    User,
    Task,
    Gift,
    VerificationCode,
    UserCompletedTask,
    UserActiveMission,
    UserRedeemedGift
};
