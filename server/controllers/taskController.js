const Task = require('../models/Task');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');

// @desc    Get all tasks
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ isActive: true }).sort({ order: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách nhiệm vụ' });
    }
};

// @desc    Get user's task progress
// @route   GET /api/tasks/progress
exports.getProgress = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const tasks = await Task.find({ isActive: true }).sort({ order: 1 });
        const completedTaskIds = (user.completedTasks || []).map(t => t.taskId ? t.taskId.toString() : null).filter(Boolean);

        const tasksWithProgress = tasks.map(task => {
            const mission = (user.activeMissions || []).find(m => m.taskId && m.taskId.toString() === task._id.toString());
            return {
                ...task._doc,
                isCompleted: completedTaskIds.includes(task._id.toString()),
                missionStatus: mission ? mission.status : null,
                expiresAt: mission ? mission.expiresAt : null
            };
        });

        res.json({
            tasks: tasksWithProgress,
            longTermProgress: user.longTermProgress,
            totalCompleted: (user.completedTasks || []).length
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy tiến độ nhiệm vụ' });
    }
};



// @desc    Start a mission (set 30min timer)
// @route   POST /api/tasks/start/:taskId
exports.startMission = async (req, res) => {
    try {
        const { taskId } = req.params;
        const mongoose = require('mongoose');

        if (!mongoose.Types.ObjectId.isValid(taskId)) {
            return res.status(400).json({ message: 'ID nhiệm vụ không hợp lệ' });
        }

        const task = await Task.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        
        if (!user.activeMissions) {
            user.activeMissions = [];
        }

        const missionIndex = user.activeMissions.findIndex(m => m.taskId && m.taskId.toString() === taskId);
        
        // Calculate duration: use task duration or fallback. Long-term tasks get more time.
        let durationMinutes = task.duration || 30;
        if (task.category === 'long-term' && durationMinutes < 60) {
            durationMinutes = 60; // Give at least 1 hour for long-term/distance tasks
        }
        
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

        if (missionIndex > -1) {
            const mission = user.activeMissions[missionIndex];
            
            // If completed
            if (mission.status === 'completed') {
                return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' });
            }

            // If already started and NOT expired
            if (mission.status === 'started' && mission.expiresAt > new Date()) {
                return res.status(400).json({ missionStatus: 'started', message: 'Nhiệm vụ này đang được thực hiện!', expiresAt: mission.expiresAt });
            }

            // If mission is expired (manually or by time)
            // If it's the first time they retry after expiring, we might want to prompt for payment
            // Based on frontend logic, we return 400 with 'hết hạn' so it triggers handlePayment
            return res.status(400).json({ 
                missionStatus: 'expired',
                message: 'Nhiệm vụ này đã hết hạn. Vui lòng thanh toán để gia hạn/thực hiện lại!' 
            });
        } else {
            // New mission start
            user.activeMissions.push({
                taskId,
                startTime: new Date(),
                expiresAt,
                status: 'started'
            });
        }

        await user.save();
        res.json({ message: `Nhiệm vụ đã bắt đầu! Bạn có ${durationMinutes} phút để hoàn thành.`, expiresAt });
    } catch (error) {
        console.error('startMission error:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi bắt đầu nhiệm vụ', details: error.message });
    }
};

// @desc    Complete a task
// @route   POST /api/tasks/complete/:taskId
exports.completeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { code } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // 1. Check if mission exists and is not expired
        const mission = user.activeMissions.find(m => m.taskId && m.taskId.toString() === taskId);
        if (!mission) {
            return res.status(400).json({ message: 'Vui lòng bắt đầu nhiệm vụ trước!' });
        }

        if (mission.status === 'completed') {
            return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' });
        }

        if (new Date() > mission.expiresAt) {
            mission.status = 'expired';
            await user.save();
            return res.status(400).json({ message: 'Nhiệm vụ đã hết hạn. Vui lòng thanh toán để thực hiện lại.' });
        }

        // 2. Validate Code
        const validCode = await VerificationCode.findOne({ 
            code, 
            expiresAt: { $gt: new Date() } 
        });

        if (!validCode) {
            return res.status(400).json({ message: 'Mã xác nhận không chính xác hoặc đã hết hạn. Vui lòng liên hệ nhân viên.' });
        }

        // 3. Mark as completed
        mission.status = 'completed';
        if (!user.completedTasks) {
            user.completedTasks = [];
        }
        user.completedTasks.push({ taskId, completedAt: new Date() });
        await user.save();

        res.json({
            message: '🎉 Chúc mừng! Bạn đã hoàn thành nhiệm vụ!',
            completedTasks: user.completedTasks
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hoàn thành nhiệm vụ' });
    }
};

// @desc    Update long-term progress
// @route   PATCH /api/tasks/long-term
exports.updateLongTermProgress = async (req, res) => {
    try {
        const { distance, steps, usingPersonalBottle } = req.body;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (steps !== undefined) user.longTermProgress.steps = steps;
        if (distance !== undefined) user.longTermProgress.distance = distance;
        if (usingPersonalBottle !== undefined) user.longTermProgress.usingPersonalBottle = usingPersonalBottle;

        await user.save();

        res.json({
            message: 'Cập nhật tiến trình thành công!',
            longTermProgress: user.longTermProgress
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật tiến trình' });
    }
};
