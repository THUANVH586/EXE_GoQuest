const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'conson_super_secret_key_2024';

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email hoặc tên đăng nhập đã được sử dụng' });
        }

        const newUser = new User({
            username,
            email,
            password,
            displayName: displayName || username,
            role: 'user'
        });
        await newUser.save();

        const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Đăng ký thành công!',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                displayName: newUser.displayName,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        const user = await User.findOne({ $or: [{ email: identifier }, { username: identifier }] });
        if (!user) {
            return res.status(400).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email/tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Đăng nhập thành công!',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                completedTasks: user.completedTasks,
                longTermProgress: user.longTermProgress
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server, vui lòng thử lại' });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        res.json({
            ...user._doc,
            id: user._id
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi lấy thông tin người dùng' });
    }
};
// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
    try {
        const { displayName, email } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (displayName) user.displayName = displayName;
        if (email) user.email = email;

        await user.save();

        res.json({
            message: 'Cập nhật thông tin thành công!',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi cập nhật thông tin' });
    }
};
