const express = require('express');
const router = express.Router();
const { getStaffDashboard, resetCode } = require('../controllers/staffController');
const { authMiddleware, authorize } = require('../middleware/auth');

router.use(authMiddleware);
router.use(authorize('staff', 'admin'));

router.get('/dashboard', getStaffDashboard);
router.post('/reset-code', resetCode);

module.exports = router;
