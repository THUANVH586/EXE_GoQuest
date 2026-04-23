const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { connectDB } = require('./config/db');
const { User, Task, Gift, UserActiveMission, UserCompletedTask } = require('./models');

const app = express();

// Comprehensive Seed Data Function
const seedInitialData = async () => {
  try {
    const salt = await bcrypt.genSalt(10);

    // 1. Seed Admin
    const adminPassword = await bcrypt.hash('admin123', salt);
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@conson.com',
        password: adminPassword,
        displayName: 'Quản trị viên',
        role: 'admin'
      }
    });

    // 2. Seed Staff
    const staffPassword = await bcrypt.hash('staff123', salt);
    const staffData = [
      { username: 'staff_nam', email: 'nam@conson.com', password: staffPassword, displayName: 'Nguyễn Văn Nam', role: 'staff' },
      { username: 'staff_lan', email: 'lan@conson.com', password: staffPassword, displayName: 'Trần Thị Lan', role: 'staff' }
    ];
    for (const s of staffData) {
      await User.findOrCreate({ where: { username: s.username }, defaults: s });
    }

    // 3. Seed Tasks (if empty)
    const taskCount = await Task.count();
    if (taskCount === 0) {
      const sampleTasks = [
        { title: 'Thưởng thức Bánh Xèo', type: 'food', points: 15, icon: '🥞', category: 'short-term' },
        { title: 'Trang trí Nón Lá', type: 'craft', points: 25, icon: '🎨', category: 'short-term' },
        { title: 'Bảo vệ Môi trường', type: 'environment', points: 75, icon: '🌿', category: 'long-term' },
        { title: 'Hành trình khám phá', type: 'health', points: 200, icon: '🏃', category: 'long-term' }
      ];
      await Task.bulkCreate(sampleTasks);
    }

    // 4. Seed Mock Tourists (Players)
    const userPassword = await bcrypt.hash('user123', salt);
    const touristData = [
      { username: 'minh_quan', email: 'quan@gmail.com', password: userPassword, displayName: 'Minh Quân', role: 'user', points: 120 },
      { username: 'thu_thao', email: 'thao@gmail.com', password: userPassword, displayName: 'Thu Thảo', role: 'user', points: 45 },
      { username: 'hoang_long', email: 'long@gmail.com', password: userPassword, displayName: 'Hoàng Long', role: 'user', points: 210 }
    ];
    
    for (const t of touristData) {
      const [user, created] = await User.findOrCreate({ where: { username: t.username }, defaults: t });
      
      // Force update password if user already exists but login fails (common issue in seeding)
      if (!created) {
        user.password = userPassword;
        await user.save();
      } else {
        // Link some tasks to show "Activity" for NEW users
        const tasks = await Task.findAll({ limit: 2 });
        if (tasks.length >= 2) {
            if (t.username === 'minh_quan') {
                await user.addCompletedTask(tasks[0]);
                await UserActiveMission.findOrCreate({ where: { UserId: user.id, TaskId: tasks[1].id }, defaults: { status: 'started' } });
            }
            if (t.username === 'thu_thao') {
                await UserActiveMission.findOrCreate({ where: { UserId: user.id, TaskId: tasks[0].id }, defaults: { status: 'started' } });
            }
            if (t.username === 'hoang_long') {
                await user.addCompletedTask(tasks[0]);
                await user.addCompletedTask(tasks[1]);
            }
        }
      }
    }

    console.log('✨ Mock data (Staff & Tourists) synchronized and secured!');
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
    res.json({
      status: 'ok',
      message: 'Go Quest API is running!',
      users: userCount
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
