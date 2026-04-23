const express = require('express');
const router = express.Router();
const { Gift, User, Task, VerificationCode, UserRedeemedGift } = require('../models');
const { authMiddleware, authorize } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET all gifts (public for users to see)
router.get('/', async (req, res) => {
    try {
        const gifts = await Gift.findAll({ 
            where: { isActive: true },
            order: [['pointsRequired', 'ASC']]
        });
        res.json(gifts);
    } catch (err) {
        console.error('Get gifts error:', err);
        res.status(500).json({ message: 'Lỗi lấy danh sách quà tặng' });
    }
});

// POST redeem a gift (authenticated user)
router.post('/:id/redeem', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã xác nhận từ nhân viên' });

        const gift = await Gift.findByPk(req.params.id);
        if (!gift || !gift.isActive) return res.status(404).json({ message: 'Không tìm thấy quà tặng' });

        if (gift.stock === 0) return res.status(400).json({ message: 'Quà tặng này đã hết hàng' });

        const user = await User.findByPk(req.userId, {
            include: ['completedTasks']
        });
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Calculate current user points (Simplified for SQL version)
        const totalPts = user.points || 0;

        if (totalPts < gift.pointsRequired) {
            return res.status(400).json({ 
                message: `Bạn không đủ điểm. Cần ${gift.pointsRequired} điểm, bạn đang có ${totalPts} điểm.` 
            });
        }

        // Validate verification code
        const validCode = await VerificationCode.findOne({ 
            where: {
                code, 
                expiresAt: { [Op.gt]: new Date() } 
            }
        });
        if (!validCode) {
            return res.status(400).json({ message: 'Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng liên hệ nhân viên.' });
        }

        // Deduct stock and points
        if (gift.stock > 0) {
            await gift.decrement('stock');
        }
        
        await UserRedeemedGift.create({
            UserId: user.id,
            GiftId: gift.id,
            giftTitle: gift.title,
            pointsSpent: gift.pointsRequired
        });
        
        // Hủy mã sau khi dùng
        await validCode.destroy();
        
        res.json({ 
            message: `🎁 Chúc mừng! Bạn đã đổi thành công "${gift.title}"!`,
            pointsSpent: gift.pointsRequired,
            remainingPoints: totalPts - gift.pointsRequired
        });
    } catch (err) {
        console.error('Redeem gift error:', err);
        res.status(500).json({ message: 'Lỗi đổi quà tặng' });
    }
});

// Admin management routes
router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const gift = await Gift.create(req.body);
        res.status(201).json(gift);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi tạo quà tặng' });
    }
});

router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const gift = await Gift.findByPk(req.params.id);
        if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng' });
        await gift.update(req.body);
        res.json(gift);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi cập nhật quà tặng' });
    }
});

router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const gift = await Gift.findByPk(req.params.id);
        if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng' });
        await gift.update({ isActive: false });
        res.json({ message: 'Đã xóa quà tặng thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa quà tặng' });
    }
});

module.exports = router;
