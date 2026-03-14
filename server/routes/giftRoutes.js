const express = require('express');
const router = express.Router();
const Gift = require('../models/Gift');
const User = require('../models/User');
const Task = require('../models/Task');
const VerificationCode = require('../models/VerificationCode');
const { authMiddleware, authorize } = require('../middleware/auth');

// GET all gifts (public for users to see)
router.get('/', async (req, res) => {
    try {
        const gifts = await Gift.find({ isActive: true }).sort({ pointsRequired: 1 });
        res.json(gifts);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy danh sách quà tặng' });
    }
});

// POST redeem a gift (authenticated user)
router.post('/:id/redeem', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Vui lòng nhập mã xác nhận từ nhân viên' });

        const gift = await Gift.findById(req.params.id);
        if (!gift || !gift.isActive) return res.status(404).json({ message: 'Không tìm thấy quà tặng' });

        if (gift.stock === 0) return res.status(400).json({ message: 'Quà tặng này đã hết hàng' });

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Calculate current user points
        const tasks = await Task.find({ isActive: true });
        const completedTaskIds = (user.completedTasks || []).map(t => t.taskId?.toString());
        const basePts = tasks
            .filter(t => completedTaskIds.includes(t._id.toString()))
            .reduce((sum, t) => sum + (t.points || 0), 0);
        const plasticPts = user.longTermProgress?.usingPersonalBottle ? 50 : 0;
        const distancePts = (user.longTermProgress?.distance || 0) >= 2000 ? 200 : 0;
        const spentPts = (user.redeemedGifts || []).reduce((sum, g) => sum + (g.pointsSpent || 0), 0);
        const totalPts = basePts + plasticPts + distancePts - spentPts;

        if (totalPts < gift.pointsRequired) {
            return res.status(400).json({ 
                message: `Bạn không đủ điểm. Cần ${gift.pointsRequired} điểm, bạn đang có ${totalPts} điểm.` 
            });
        }

        // Validate verification code
        const validCode = await VerificationCode.findOne({ 
            code, 
            expiresAt: { $gt: new Date() } 
        });
        if (!validCode) {
            return res.status(400).json({ message: 'Mã xác nhận không đúng hoặc đã hết hạn. Vui lòng liên hệ nhân viên.' });
        }

        // Deduct stock if limited
        if (gift.stock > 0) {
            gift.stock = gift.stock - 1;
            await gift.save();
        }

        // Record redemption
        if (!user.redeemedGifts) user.redeemedGifts = [];
        user.redeemedGifts.push({
            giftId: gift._id,
            giftTitle: gift.title,
            pointsSpent: gift.pointsRequired,
            redeemedAt: new Date()
        });
        await user.save();

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

// POST create gift (admin only)
router.post('/', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const { title, description, pointsRequired, img, icon, stock } = req.body;
        const gift = new Gift({ title, description, pointsRequired, img, icon, stock });
        await gift.save();
        res.status(201).json(gift);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi tạo quà tặng' });
    }
});

// PUT update gift (admin only)
router.put('/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const gift = await Gift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng' });
        res.json(gift);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi cập nhật quà tặng' });
    }
});

// DELETE gift (admin only) - soft delete
router.delete('/:id', authMiddleware, authorize('admin'), async (req, res) => {
    try {
        const gift = await Gift.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
        if (!gift) return res.status(404).json({ message: 'Không tìm thấy quà tặng' });
        res.json({ message: 'Đã xóa quà tặng thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi xóa quà tặng' });
    }
});

module.exports = router;

