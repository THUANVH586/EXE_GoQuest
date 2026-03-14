const express = require('express');
const router = express.Router();
const { getUsersReport, deleteUser, createTask, updateTask, deleteTask, createStaff } = require('../controllers/adminController');
const { authMiddleware, adminMiddleware, authorize } = require('../middleware/auth');

router.get('/users', authMiddleware, authorize('admin'), getUsersReport);
router.delete('/users/:id', authMiddleware, authorize('admin'), deleteUser);

// Staff Management
router.post('/staff', authMiddleware, authorize('admin'), createStaff);

// Task Management
router.post('/tasks', authMiddleware, authorize('admin'), createTask);
router.put('/tasks/:id', authMiddleware, authorize('admin'), updateTask);
router.delete('/tasks/:id', authMiddleware, authorize('admin'), deleteTask);

module.exports = router;
