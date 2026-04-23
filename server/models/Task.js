const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Task = sequelize.define('Task', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('food', 'craft', 'community', 'health', 'environment'),
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('short-term', 'long-term'),
        defaultValue: 'short-term'
    },
    locationName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    locationDescription: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    duration: {
        type: DataTypes.INTEGER,
        defaultValue: 15
    },
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: '🎯'
    },
    img: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    timestamps: true,
    tableName: 'Tasks'
});

module.exports = Task;
