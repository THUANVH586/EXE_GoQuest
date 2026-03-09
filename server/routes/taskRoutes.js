const express = require('express');
const router = express.Router();
const { getTasks, getProgress, completeTask, updateLongTermProgress } = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getTasks);
router.get('/progress', authMiddleware, getProgress);
router.post('/complete/:taskId', authMiddleware, completeTask);
router.patch('/long-term', authMiddleware, updateLongTermProgress);

module.exports = router;
