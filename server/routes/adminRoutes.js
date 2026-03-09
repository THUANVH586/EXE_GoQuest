const express = require('express');
const router = express.Router();
const { getUsersReport, createTask, updateTask, deleteTask } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.get('/users', authMiddleware, adminMiddleware, getUsersReport);

// Task Management
router.post('/tasks', authMiddleware, adminMiddleware, createTask);
router.put('/tasks/:id', authMiddleware, adminMiddleware, updateTask);
router.delete('/tasks/:id', authMiddleware, adminMiddleware, deleteTask);

module.exports = router;
