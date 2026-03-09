const Task = require('../models/Task');
const User = require('../models/User');

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

        const tasksWithProgress = tasks.map(task => ({
            ...task._doc,
            isCompleted: completedTaskIds.includes(task._id.toString())
        }));

        res.json({
            tasks: tasksWithProgress,
            longTermProgress: user.longTermProgress,
            totalCompleted: user.completedTasks.length
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy tiến độ nhiệm vụ' });
    }
};

// @desc    Complete a task
// @route   POST /api/tasks/complete/:taskId
exports.completeTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const alreadyCompleted = user.completedTasks.some(t => t.taskId.toString() === taskId);
        if (alreadyCompleted) {
            return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' });
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
