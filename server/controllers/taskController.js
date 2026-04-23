const { Task, User, VerificationCode, UserActiveMission, UserCompletedTask } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all tasks
// @route   GET /api/tasks
exports.getTasks = async (req, res) => {
    try {
        const tasks = await Task.findAll({ 
            where: { isActive: true },
            order: [['order', 'ASC']]
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy danh sách nhiệm vụ' });
    }
};

// @desc    Get user's task progress
// @route   GET /api/tasks/progress
exports.getProgress = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId, {
            include: [
                { association: 'completedTasks' },
                { association: 'activeMissions' }
            ]
        });
        
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const tasks = await Task.findAll({ 
            where: { isActive: true },
            order: [['order', 'ASC']]
        });

        const completedTaskIds = (user.completedTasks || []).map(t => t.id);

        const tasksWithProgress = tasks.map(task => {
            const mission = (user.activeMissions || []).find(m => m.id === task.id);
            return {
                ...task.get({ plain: true }),
                isCompleted: completedTaskIds.includes(task.id),
                missionStatus: mission ? mission.UserActiveMission.status : null,
                expiresAt: mission ? mission.UserActiveMission.expiresAt : null
            };
        });

        res.json({
            tasks: tasksWithProgress,
            longTermProgress: {
                steps: user.steps,
                distance: user.distance,
                usingPersonalBottle: user.usingPersonalBottle
            },
            totalCompleted: (user.completedTasks || []).length
        });
    } catch (error) {
        console.error('getProgress error:', error);
        res.status(500).json({ message: 'Lỗi lấy tiến độ nhiệm vụ' });
    }
};

// @desc    Start a mission (set timer)
// @route   POST /api/tasks/start/:taskId
exports.startMission = async (req, res) => {
    try {
        const { taskId } = req.params;

        const task = await Task.findByPk(taskId);
        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Check if mission already exists in join table
        const existingMission = await UserActiveMission.findOne({
            where: { UserId: user.id, TaskId: task.id }
        });

        let durationMinutes = task.duration || 30;
        if (task.category === 'long-term' && durationMinutes < 60) {
            durationMinutes = 60;
        }
        const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);

        if (existingMission) {
            if (existingMission.status === 'completed') {
                return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' });
            }

            if (existingMission.status === 'started' && existingMission.expiresAt > new Date()) {
                return res.status(400).json({ 
                    missionStatus: 'started', 
                    message: 'Nhiệm vụ này đang được thực hiện!', 
                    expiresAt: existingMission.expiresAt 
                });
            }

            // Retry/Update expired mission
            return res.status(400).json({ 
                missionStatus: 'expired',
                message: 'Nhiệm vụ này đã hết hạn. Vui lòng thanh toán để gia hạn/thực hiện lại!' 
            });
        } else {
            // New mission start
            await UserActiveMission.create({
                UserId: user.id,
                TaskId: task.id,
                startTime: new Date(),
                expiresAt,
                status: 'started'
            });
        }

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

        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // 1. Check if mission exists and is not expired
        const mission = await UserActiveMission.findOne({
            where: { UserId: user.id, TaskId: taskId }
        });

        if (!mission) {
            return res.status(400).json({ message: 'Vui lòng bắt đầu nhiệm vụ trước!' });
        }

        if (mission.status === 'completed') {
            return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' });
        }

        if (new Date() > mission.expiresAt) {
            mission.status = 'expired';
            await mission.save();
            return res.status(400).json({ message: 'Nhiệm vụ đã hết hạn. Vui lòng thanh toán để thực hiện lại.' });
        }

        // 2. Validate Code
        const validCode = await VerificationCode.findOne({ 
            where: {
                code,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        if (!validCode) {
            return res.status(400).json({ message: 'Mã xác nhận không chính xác hoặc đã hết hạn. Vui lòng liên hệ nhân viên.' });
        }

        // 3. Mark as completed
        mission.status = 'completed';
        await mission.save();

        // Add to completed tasks join table
        await UserCompletedTask.findOrCreate({
            where: { UserId: user.id, TaskId: taskId },
            defaults: { completedAt: new Date() }
        });

        res.json({
            message: '🎉 Chúc mừng! Bạn đã hoàn thành nhiệm vụ!'
        });
    } catch (error) {
        console.error('completeTask error:', error);
        res.status(500).json({ message: 'Lỗi hoàn thành nhiệm vụ' });
    }
};

// @desc    Update long-term progress
// @route   PATCH /api/tasks/long-term
exports.updateLongTermProgress = async (req, res) => {
    try {
        const { distance, steps, usingPersonalBottle } = req.body;
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (steps !== undefined) user.steps = steps;
        if (distance !== undefined) user.distance = distance;
        if (usingPersonalBottle !== undefined) user.usingPersonalBottle = usingPersonalBottle;

        await user.save();

        res.json({
            message: 'Cập nhật tiến trình thành công!',
            longTermProgress: {
                steps: user.steps,
                distance: user.distance,
                usingPersonalBottle: user.usingPersonalBottle
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật tiến trình' });
    }
};
