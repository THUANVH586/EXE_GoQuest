const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');

// Helper to get or generate current verification code
const getActiveCode = async () => {
    let current = await VerificationCode.findOne({ expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (!current) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        current = new VerificationCode({ code, expiresAt });
        await current.save();
    }
    return current;
};

// @desc    Get staff dashboard stats
// @route   GET /api/staff/dashboard
exports.getStaffDashboard = async (req, res) => {
    try {
        const totalPlayers = await User.countDocuments({ role: 'user' });
        const activePlayers = await User.find({ 
            role: 'user',
            'activeMissions.status': 'started'
        }).select('username displayName activeMissions');

        const currentCodeObj = await getActiveCode();

        res.json({
            totalPlayers,
            activePlayers: activePlayers.map(u => ({
                id: u._id,
                username: u.username,
                displayName: u.displayName,
                activeMissionsCount: u.activeMissions.filter(m => m.status === 'started').length
            })),
            currentCode: currentCodeObj.code,
            expiresAt: currentCodeObj.expiresAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi tải dữ liệu dashboard nhân viên' });
    }
};

// @desc    Manually reset/generate new code
// @route   POST /api/staff/reset-code
exports.resetCode = async (req, res) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        const newCode = new VerificationCode({ code, expiresAt });
        await newCode.save();

        res.json({
            message: 'Đã tạo mã mới thành công',
            code: newCode.code,
            expiresAt: newCode.expiresAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi reset mã' });
    }
};
