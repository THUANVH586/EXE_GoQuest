const express = require('express');
const Task = require('../models/Task');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Sample tasks data (used when DB is empty)
const sampleTasks = [
    {
        title: 'Thưởng thức Bánh Xèo',
        description: 'Đến quầy bánh dân gian trải nghiệm món bánh xèo giòn rụm đặc trưng miền Tây',
        type: 'food',
        category: 'short-term',
        location: { name: 'Quầy Cô Ba', description: 'Đầu đường chính Cồn Sơn' },
        duration: 20,
        points: 15,
        icon: '🥞',
        order: 1
    },
    {
        title: 'Trang trí Nón Lá',
        description: 'Vẽ và trang trí nón lá theo phong cách riêng của bạn',
        type: 'craft',
        category: 'short-term',
        location: { name: 'Quầy Chú Năm', description: 'Khu thủ công mỹ nghệ' },
        duration: 30,
        points: 25,
        icon: '🎨',
        order: 2
    },
    {
        title: 'Trải nghiệm Bán Hàng',
        description: 'Trải nghiệm làm người đứng quầy bán bánh tráng trộn trong 30 phút',
        type: 'community',
        category: 'short-term',
        location: { name: 'Quầy Bánh Tráng Trộn', description: 'Khu ẩm thực đường chính' },
        duration: 30,
        points: 50,
        icon: '🏪',
        order: 3
    },
    {
        title: 'Đi bộ 5000 bước',
        description: 'Khám phá Cồn Sơn bằng cách đi bộ và tích lũy 5000 bước chân',
        type: 'health',
        category: 'long-term',
        location: { name: 'Toàn bộ Cồn Sơn', description: '' },
        duration: 0,
        points: 100,
        icon: '🚶',
        order: 4
    },
    {
        title: 'Bảo vệ Môi trường',
        description: 'Mang theo bình nước cá nhân, không sử dụng ly nhựa trong suốt chuyến tham quan',
        type: 'environment',
        category: 'long-term',
        location: { name: 'Toàn bộ Cồn Sơn', description: '' },
        duration: 0,
        points: 75,
        icon: '🌿',
        order: 5
    },
    {
        title: 'Thưởng thức Chè Bưởi',
        description: 'Nếm thử món chè bưởi mát lạnh đặc sản Cồn Sơn',
        type: 'food',
        category: 'short-term',
        location: { name: 'Quầy Chè Cô Tư', description: 'Gần bến thuyền' },
        duration: 15,
        points: 10,
        icon: '🍨',
        order: 6
    },
    {
        title: 'Học làm Bánh Dân Gian',
        description: 'Tham gia workshop học làm bánh lá dừa truyền thống',
        type: 'craft',
        category: 'short-term',
        location: { name: 'Khu Workshop', description: 'Nhà văn hóa Cồn Sơn' },
        duration: 45,
        points: 35,
        icon: '🍰',
        order: 7
    }
];

// Get all tasks
router.get('/', async (req, res) => {
    try {
        let tasks = await Task.find({ isActive: true }).sort({ order: 1 });

        // If no tasks in DB, return sample tasks
        if (tasks.length === 0) {
            tasks = sampleTasks;
        }

        res.json(tasks);
    } catch (error) {
        // Return sample tasks if DB error
        res.json(sampleTasks);
    }
});

// Get user's task progress
router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        const tasks = await Task.find({ isActive: true }).sort({ order: 1 });
        const completedTaskIds = user.completedTasks.map(t => t.taskId?.toString());

        const tasksWithProgress = (tasks.length > 0 ? tasks : sampleTasks).map((task, index) => ({
            ...task.toObject ? task.toObject() : task,
            isCompleted: completedTaskIds.includes(task._id?.toString()),
            id: task._id || index
        }));

        const pointsSpent = (user.redeemedGifts || []).reduce((sum, g) => sum + (g.pointsSpent || 0), 0);

        res.json({
            tasks: tasksWithProgress,
            longTermProgress: user.longTermProgress,
            totalCompleted: user.completedTasks.length,
            pointsSpent
        });
    } catch (error) {
        console.error('Progress error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Complete a task
router.post('/complete/:taskId', authMiddleware, async (req, res) => {
    try {
        const { taskId } = req.params;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Check if already completed
        const alreadyCompleted = user.completedTasks.some(
            t => t.taskId?.toString() === taskId
        );

        if (alreadyCompleted) {
            return res.status(400).json({ message: 'Bạn đã hoàn thành nhiệm vụ này rồi!' });
        }

        // Add to completed tasks
        user.completedTasks.push({ taskId, completedAt: new Date() });
        await user.save();

        res.json({
            message: '🎉 Chúc mừng! Bạn đã hoàn thành nhiệm vụ!',
            completedTasks: user.completedTasks
        });
    } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Update long-term progress (steps, bottle)
router.patch('/long-term', authMiddleware, async (req, res) => {
    try {
        const { steps, usingPersonalBottle, distance } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (steps !== undefined) {
            user.longTermProgress.steps = steps;
        }
        if (usingPersonalBottle !== undefined) {
            user.longTermProgress.usingPersonalBottle = usingPersonalBottle;
        }
        if (distance !== undefined) {
            user.longTermProgress.distance = distance;
        }

        await user.save();

        res.json({
            message: 'Cập nhật tiến trình thành công!',
            longTermProgress: user.longTermProgress
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Seed sample tasks (admin)
router.post('/seed', async (req, res) => {
    try {
        await Task.deleteMany({});
        await Task.insertMany(sampleTasks);
        res.json({ message: 'Sample tasks created!', count: sampleTasks.length });
    } catch (error) {
        res.status(500).json({ message: 'Error seeding tasks' });
    }
});

module.exports = router;
