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

// @desc    Assign 5 random tasks to user
// @route   POST /api/tasks/assign
exports.assignTasks = async (req, res) => {
    try {
        const { taskIds } = req.body;
        const user = await User.findByPk(req.userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Clear previous assigned tasks if any (only those not completed)
        await UserActiveMission.destroy({
            where: { UserId: user.id, status: { [Op.ne]: 'completed' } }
        });

        // Assign new ones
        const assignPromises = taskIds.map(taskId => {
            return UserActiveMission.create({
                UserId: user.id,
                TaskId: taskId,
                status: 'assigned' // Initial status before starting timer
            });
        });

        await Promise.all(assignPromises);
        res.json({ message: 'Đã lưu danh sách nhiệm vụ vào hệ thống!' });
    } catch (error) {
        console.error('assignTasks error:', error);
        res.status(500).json({ message: 'Lỗi lưu danh sách nhiệm vụ' });
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

        // Return all tasks but mark those assigned/completed
        const allTasks = await Task.findAll({
            where: { isActive: true },
            order: [['order', 'ASC']]
        });

        const completedTaskIds = (user.completedTasks || []).map(t => t.id);
        const assignedMissions = user.activeMissions || [];

        const tasksWithProgress = allTasks.map(task => {
            const mission = assignedMissions.find(m => m.id === task.id);
            return {
                ...task.get({ plain: true }),
                isCompleted: completedTaskIds.includes(task.id),
                missionStatus: mission ? mission.UserActiveMission.status : null,
                expiresAt: mission ? mission.UserActiveMission.expiresAt : null,
                isAssigned: !!mission
            };
        });

        res.json({
            tasks: tasksWithProgress,
            assignedTasks: tasksWithProgress.filter(t => t.isAssigned || t.isCompleted),
            longTermProgress: {
                steps: user.steps,
                distance: user.distance,
                usingPersonalBottle: user.usingPersonalBottle
            },
            totalCompleted: completedTaskIds.length
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
        if (!task) return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });

        const mission = await UserActiveMission.findOne({
            where: { UserId: req.userId, TaskId: taskId }
        });

        if (!mission) {
            // Auto-assign if not already assigned
            await UserActiveMission.create({
                UserId: req.userId,
                TaskId: taskId,
                status: 'started',
                startTime: new Date(),
                expiresAt: new Date(Date.now() + (task.duration || 30) * 60 * 1000)
            });
        } else {
            if (mission.status === 'completed') return res.status(400).json({ message: 'Đã hoàn thành!' });

            mission.status = 'started';
            mission.startTime = new Date();
            mission.expiresAt = new Date(Date.now() + (task.duration || 30) * 60 * 1000);
            await mission.save();
        }

        res.json({ message: 'Nhiệm vụ đã bắt đầu!', expiresAt: mission?.expiresAt });
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

        const user = await User.findByPk(req.userId);
        const mission = await UserActiveMission.findOne({
            where: { UserId: user.id, TaskId: taskId }
        });

        if (!mission || mission.status !== 'started') {
            return res.status(400).json({ message: 'Vui lòng bắt đầu nhiệm vụ trước!' });
        }

        // Validate Code
        const validCode = await VerificationCode.findOne({
            where: { code, expiresAt: { [Op.gt]: new Date() } }
        });

        if (!validCode) {
            return res.status(400).json({ message: 'Mã xác nhận không đúng!' });
        }

        // Update status
        mission.status = 'completed';
        await mission.save();

        await UserCompletedTask.findOrCreate({
            where: { UserId: user.id, TaskId: taskId },
            defaults: { completedAt: new Date() }
        });

        // Hủy mã sau khi dùng để mỗi nhiệm vụ là một mã duy nhất
        await validCode.destroy();

        res.json({ message: '🎉 Chúc mừng bạn đã hoàn thành!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi hoàn thành nhiệm vụ' });
    }
};

// @desc    Update long-term progress
exports.updateLongTermProgress = async (req, res) => {
    try {
        const { distance, steps, usingPersonalBottle } = req.body;
        const user = await User.findByPk(req.userId);
        if (steps !== undefined) user.steps = steps;
        if (distance !== undefined) user.distance = distance;
        if (usingPersonalBottle !== undefined) user.usingPersonalBottle = usingPersonalBottle;
        await user.save();
        res.json({ message: 'Cập nhật thành công!' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật' });
    }
};
