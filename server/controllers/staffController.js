const { User, Task, VerificationCode, UserActiveMission } = require('../models');
const { Op } = require('sequelize');

// Helper to get or generate current verification code
const getActiveCode = async () => {
    let current = await VerificationCode.findOne({ 
        where: { expiresAt: { [Op.gt]: new Date() } },
        order: [['createdAt', 'DESC']]
    });
    
    if (!current) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        current = await VerificationCode.create({ code, expiresAt });
    }
    return current;
};

// @desc    Get staff dashboard stats
// @route   GET /api/staff/dashboard
exports.getStaffDashboard = async (req, res) => {
    try {
        const totalPlayers = await User.count({ where: { role: 'user' } });
        
        // Find users with at least one started mission
        const playersWithActiveMissions = await User.findAll({
            where: { role: 'user' },
            include: [{
                model: Task,
                as: 'activeMissions',
                through: {
                    where: { status: 'started' }
                }
            }]
        });

        const activePlayers = playersWithActiveMissions.filter(u => u.activeMissions?.length > 0);

        const currentCodeObj = await getActiveCode();

        // Get redemption history
        const usersWithGifts = await User.findAll({
            include: [{ association: 'redeemedGifts' }]
        });
        
        const redemptionHistory = [];
        usersWithGifts.forEach(u => {
            if (u.redeemedGifts) {
                u.redeemedGifts.forEach(g => {
                    redemptionHistory.push({
                        id: g.UserRedeemedGift.GiftId + '_' + g.UserRedeemedGift.UserId + '_' + new Date(g.UserRedeemedGift.redeemedAt).getTime(),
                        username: u.username,
                        displayName: u.displayName,
                        giftTitle: g.UserRedeemedGift.giftTitle || g.title,
                        pointsSpent: g.UserRedeemedGift.pointsSpent,
                        redeemedAt: g.UserRedeemedGift.redeemedAt
                    });
                });
            }
        });
        // Sort newest first, take top 50
        redemptionHistory.sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
        const recentRedemptions = redemptionHistory.slice(0, 50);

        res.json({
            totalPlayers,
            activePlayers: activePlayers.map(u => ({
                id: u.id,
                username: u.username,
                displayName: u.displayName,
                activeMissions: u.activeMissions.map(m => ({
                    taskId: m.id,
                    title: m.title,
                    startTime: m.UserActiveMission.startTime
                })),
                activeMissionsCount: u.activeMissions.length
            })),
            currentCode: currentCodeObj.code,
            expiresAt: currentCodeObj.expiresAt,
            recentRedemptions
        });
    } catch (error) {
        console.error('Error fetching staff dashboard:', error);
        res.status(500).json({ message: 'Lỗi tải dữ liệu dashboard nhân viên' });
    }
};

// @desc    Manually reset/generate new code
// @route   POST /api/staff/reset-code
exports.resetCode = async (req, res) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        const newCode = await VerificationCode.create({ code, expiresAt });

        res.json({
            message: 'Đã tạo mã mới thành công',
            code: newCode.code,
            expiresAt: newCode.expiresAt
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi reset mã' });
    }
};
