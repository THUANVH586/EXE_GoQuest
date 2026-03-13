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
        const completedTaskIds = user.completedTasks.map(t => t.taskId.toString());

        const tasksWithProgress = tasks.map(task => {
            const mission = user.activeMissions.find(m => m.taskId.toString() === task._id.toString());
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
            totalCompleted: user.completedTasks.length
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
        const user = await User.findById(req.userId);
        
        if (!user.activeMissions) {
            user.activeMissions = [];
        }

        const missionIndex = user.activeMissions.findIndex(m => m.taskId.toString() === taskId);
        
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        if (missionIndex > -1) {
            // If already started and not expired, return error or current timer
            if (user.activeMissions[missionIndex].status === 'started' && user.activeMissions[missionIndex].expiresAt > new Date()) {
                return res.status(400).json({ message: 'Nhiệm vụ này đang được thực hiện!', expiresAt: user.activeMissions[missionIndex].expiresAt });
            }
            // If expired, they need to pay (implementation later)
            if (user.activeMissions[missionIndex].status === 'expired' || user.activeMissions[missionIndex].expiresAt <= new Date()) {
                return res.status(400).json({ message: 'Nhiệm vụ đã hết hạn. Vui lòng thanh toán để thực hiện lại.' });
            }
        } else {
            user.activeMissions.push({
                taskId,
                startTime: new Date(),
                expiresAt,
                status: 'started'
            });
        }

        await user.save();
        res.json({ message: 'Nhiệm vụ đã bắt đầu! Bạn có 30 phút để hoàn thành.', expiresAt });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi bắt đầu nhiệm vụ' });
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
        const mission = user.activeMissions.find(m => m.taskId.toString() === taskId);
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
