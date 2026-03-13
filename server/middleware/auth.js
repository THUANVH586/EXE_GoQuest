const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'conson_super_secret_key_2024';

// Protect routes - User must be logged in
exports.authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục' });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

// Role-based authorization
exports.authorize = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.userId);
            if (!user) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng' });
            }
            if (!roles.includes(user.role)) {
                return res.status(403).json({ message: `Quyền truy cập bị từ chối. Cần quyền: ${roles.join(', ')}` });
            }
            next();
        } catch (error) {
            res.status(500).json({ message: 'Lỗi kiểm tra quyền' });
        }
    };
};
