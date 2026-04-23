const { User, Task } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all users (Dashboard data)
// @route   GET /api/admin/users
exports.getUsersReport = async (req, res) => {
    try {
        const tasks = await Task.findAll({ where: { isActive: true } });
        const users = await User.findAll({
            include: ['completedTasks', 'activeMissions']
        });

        const allUsers = users.map(u => {
            const REQUIRED_TASKS = 5;
            
            // Calculate total points
            const userPoints = tasks
                .filter(t => (u.completedTasks || []).some(ct => ct.id === t.id))
                .reduce((sum, t) => sum + t.points, 0);

            // Get last completion time
            const lastCompletedAt = (u.completedTasks || []).length > 0
                ? new Date(Math.max(...u.completedTasks.map(t => new Date(t.UserCompletedTask.completedAt))))
                : null;

            // Determine status
            let status = 'Chưa bắt đầu';
            if ((u.completedTasks || []).length >= REQUIRED_TASKS) {
                status = 'Đã hoàn thành';
            } else if ((u.completedTasks || []).length > 0 || u.steps > 0) {
                status = 'Đang thực hiện';
            }

            return {
                id: u.id,
                username: u.username,
                email: u.email,
                displayName: u.displayName,
                role: u.role,
                completedCount: (u.completedTasks || []).length,
                totalTasks: REQUIRED_TASKS,
                points: userPoints,
                lastCompletedAt,
                status,
                longTermProgress: {
                    steps: u.steps,
                    distance: u.distance,
                    usingPersonalBottle: u.usingPersonalBottle
                }
            };
        });

        // Sort: Role Admin always on top, then by points (desc)
        const sortedUsers = allUsers.sort((a, b) => {
            if (a.role === 'admin' && b.role !== 'admin') return -1;
            if (a.role !== 'admin' && b.role === 'admin') return 1;

            if (b.points !== a.points) {
                return b.points - a.points;
            }

            if (a.lastCompletedAt && b.lastCompletedAt) {
                return new Date(a.lastCompletedAt) - new Date(b.lastCompletedAt);
            }

            return 0;
        });

        res.json(sortedUsers);
    } catch (error) {
        console.error('getUsersReport error:', error);
        res.status(500).json({ message: 'Lỗi lấy danh sách người dùng' });
    }
};

// @desc    Delete a user account
// @route   DELETE /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
        }

        await user.destroy();

        res.json({ message: 'Đã xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa người dùng', error: error.message });
    }
};

// @desc    Create a new task
// @route   POST /api/admin/tasks
exports.createTask = async (req, res) => {
    try {
        const { title, description, type, category, location, duration, points, icon, img, order } = req.body;

        const task = await Task.create({
            title,
            description,
            type,
            category,
            locationName: location?.name,
            locationDescription: location?.description,
            duration,
            points,
            icon,
            img,
            order
        });

        res.status(201).json(task);
    } catch (error) {
        console.error('createTask error:', error);
        res.status(500).json({ message: 'Lỗi tạo nhiệm vụ mới' });
    }
};

// @desc    Update a task
// @route   PUT /api/admin/tasks/:id
exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        const { location, ...otherData } = req.body;
        const updateData = { ...otherData };
        if (location) {
            updateData.locationName = location.name;
            updateData.locationDescription = location.description;
        }

        await task.update(updateData);

        res.json(task);
    } catch (error) {
        console.error('updateTask error:', error);
        res.status(500).json({ message: 'Lỗi cập nhật nhiệm vụ' });
    }
};

// @desc    Delete a task (Soft delete by setting isActive to false)
// @route   DELETE /api/admin/tasks/:id
exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await Task.findByPk(id);

        if (!task) {
            return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ' });
        }

        await task.update({ isActive: false });

        res.json({ message: 'Đã xóa nhiệm vụ thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xóa nhiệm vụ' });
    }
};

// @desc    Create a new staff account
// @route   POST /api/admin/staff
exports.createStaff = async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        const userExists = await User.findOne({ 
            where: { 
                [Op.or]: [{ email }, { username }] 
            } 
        });
        
        if (userExists) {
            return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
        }

        const staff = await User.create({
            username,
            email,
            password,
            displayName,
            role: 'staff'
        });

        res.status(201).json({
            message: 'Đã tạo tài khoản nhân viên thành công',
            staff: {
                id: staff.id,
                username: staff.username,
                email: staff.email,
                role: staff.role
            }
        });
    } catch (error) {
        console.error('createStaff error:', error);
        res.status(500).json({ message: 'Lỗi tạo tài khoản nhân viên' });
    }
};
