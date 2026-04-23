const express = require('express');
const router = express.Router();
const { getTasks, getProgress, completeTask, updateLongTermProgress, startMission, assignTasks } = require('../controllers/taskController');
const { authMiddleware } = require('../middleware/auth');

router.get('/', getTasks);
router.get('/progress', authMiddleware, getProgress);
router.post('/assign', authMiddleware, assignTasks);
router.post('/start/:taskId', authMiddleware, startMission);
router.post('/complete/:taskId', authMiddleware, completeTask);
router.patch('/long-term', authMiddleware, updateLongTermProgress);

module.exports = router;
