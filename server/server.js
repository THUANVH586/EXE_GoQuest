const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { User, Task, Gift, UserActiveMission, UserCompletedTask, sequelize } = require('./models');

const app = express();

const sampleTasks = [
    { title: 'Thưởng thức Bánh Xèo', description: 'Đến quầy bánh dân gian trải nghiệm món bánh xèo giòn rụm đặc trưng miền Tây', type: 'food', category: 'short-term', locationName: 'Quầy Cô Ba', locationDescription: 'Đầu đường chính Cồn Sơn', duration: 20, points: 15, icon: '🥞', order: 1 },
    { title: 'Trang trí Nón Lá', description: 'Vẽ và trang trí nón lá theo phong cách riêng của bạn', type: 'craft', category: 'short-term', locationName: 'Quầy Chú Năm', locationDescription: 'Khu thủ công mỹ nghệ', duration: 30, points: 25, icon: '🎨', order: 2 },
    { title: 'Trải nghiệm Bán Hàng', description: 'Trải nghiệm làm người đứng quầy bán bánh tráng trộn trong 30 phút', type: 'community', category: 'short-term', locationName: 'Quầy Bánh Tráng Trộn', locationDescription: 'Khu ẩm thực đường chính', duration: 30, points: 50, icon: '🏪', order: 3 },
    { title: 'Hành trình khám phá', description: 'Khám phá Cồn Sơn bằng cách di chuyển và tích lũy ít nhất 2000m', type: 'health', category: 'long-term', locationName: 'Toàn bộ Cồn Sơn', locationDescription: '', duration: 0, points: 200, icon: '🏃', order: 4 },
    { title: 'Bảo vệ Môi trường', description: 'Mang theo bình nước cá nhân, không sử dụng ly nhựa trong suốt chuyến tham quan', type: 'environment', category: 'long-term', locationName: 'Toàn bộ Cồn Sơn', locationDescription: '', duration: 0, points: 75, icon: '🌿', order: 5 },
    { title: 'Thưởng thức Chè Bưởi', description: 'Nếm thử món chè bưởi mát lạnh đặc sản Cồn Sơn', type: 'food', category: 'short-term', locationName: 'Quầy Chè Cô Tư', locationDescription: 'Gần bến thuyền', duration: 15, points: 10, icon: '🍨', order: 6 },
    { title: 'Học làm Bánh Dân Gian', description: 'Tham gia workshop học làm bánh lá dừa truyền thống', type: 'craft', category: 'short-term', locationName: 'Khu Workshop', locationDescription: 'Nhà văn hóa Cồn Sơn', duration: 45, points: 35, icon: '🍰', order: 7 }
];

const sampleGifts = [
    { title: 'Nón lá Cồn Sơn', description: 'Chiếc nón lá truyền thống được các nghệ nhân Cồn Sơn đan thủ công.', pointsRequired: 200, icon: '👒', stock: 50 },
    { title: 'Móc khóa Gỗ', description: 'Móc khóa gỗ khắc hình lưu niệm Cồn Sơn độc đáo.', pointsRequired: 50, icon: '🔑', stock: 100 },
    { title: 'Túi vải Canvas', description: 'Túi vải thân thiện môi trường với họa tiết sống xanh.', pointsRequired: 150, icon: '🛍️', stock: 30 },
    { title: 'Bộ Bánh Dân Gian', description: 'Hộp quà gồm các loại bánh dân gian đặc sản địa phương.', pointsRequired: 300, icon: '🍱', stock: 20 }
];

// Comprehensive Seed Data Function with FORCE CLEANING
const seedInitialData = async () => {
  try {
    console.log('🧹 Syncing database structure and cleaning tasks...');
    
    // Sync structure changes (like new ENUM values)
    await sequelize.sync({ alter: true });

    // 1. Seed Admin
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: { username: 'admin', email: 'admin@conson.com', password: 'admin123', displayName: 'Quản trị viên', role: 'admin' }
    });
    admin.password = 'admin123';
    await admin.save();

    // 2. Clear and Re-seed Tasks
    await Task.destroy({ where: {}, truncate: false, cascade: true }); // Clean all
    await Task.bulkCreate(sampleTasks);
    console.log('✅ Tasks cleaned and re-seeded (7 unique tasks)');

    // 3. Clear and Re-seed Gifts
    await Gift.destroy({ where: {}, truncate: false, cascade: true });
    await Gift.bulkCreate(sampleGifts);
    console.log('✅ Gifts cleaned and re-seeded');

    // 4. Seed Mock Tourists
    const touristData = [
      { username: 'minh_quan', email: 'quan@gmail.com', password: 'user123', displayName: 'Minh Quân', role: 'user', points: 120 },
      { username: 'thu_thao', email: 'thao@gmail.com', password: 'user123', displayName: 'Thu Thảo', role: 'user', points: 45 },
      { username: 'hoang_long', email: 'long@gmail.com', password: 'user123', displayName: 'Hoàng Long', role: 'user', points: 210 }
    ];
    
    for (const t of touristData) {
      const [user] = await User.findOrCreate({ where: { username: t.username }, defaults: t });
      user.password = t.password;
      await user.save();
    }

    console.log('✨ DATABASE IS NOW CLEAN AND SYNCED!');
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
};

// Connect and Seed
connectDB().then(() => {
  seedInitialData();
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/gifts', require('./routes/giftRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.count();
    res.json({ status: 'ok', message: 'Go Quest API is running!', users: userCount });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
