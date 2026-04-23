const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Gift = sequelize.define('Gift', {
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
    pointsRequired: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
    },
    img: {
        type: DataTypes.STRING,
        defaultValue: ''
    },
    icon: {
        type: DataTypes.STRING,
        defaultValue: '🎁'
    },
    stock: {
        type: DataTypes.INTEGER,
        defaultValue: -1 // -1 = unlimited
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    tableName: 'Gifts'
});

module.exports = Gift;
