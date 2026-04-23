const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { User, Task, Gift, UserActiveMission, UserCompletedTask } = require('./models');

const app = express();

// Direct Database Seeding Function
const seedInitialData = async () => {
  try {
    console.log('🔄 Checking and seeding database data...');

    // 1. Seed Admin
    const [admin] = await User.findOrCreate({
      where: { username: 'admin' },
      defaults: {
        username: 'admin',
        email: 'admin@conson.com',
        password: 'admin123', // Let the model hook hash it
        displayName: 'Quản trị viên',
        role: 'admin'
      }
    });
    // Force update password to plain text so the hook hashes it correctly if it was double-hashed before
    admin.password = 'admin123';
    await admin.save();

    // 2. Seed Staff
    const staffData = [
      { username: 'staff_nam', email: 'nam@conson.com', password: 'staff123', displayName: 'Nguyễn Văn Nam', role: 'staff' },
      { username: 'staff_lan', email: 'lan@conson.com', password: 'staff123', displayName: 'Trần Thị Lan', role: 'staff' }
    ];
    for (const s of staffData) {
      const [staff] = await User.findOrCreate({ where: { username: s.username }, defaults: s });
      staff.password = s.password;
      await staff.save();
    }

    // 3. Seed Mock Tourists (Players)
    const touristData = [
      { username: 'minh_quan', email: 'quan@gmail.com', password: 'user123', displayName: 'Minh Quân', role: 'user', points: 120 },
      { username: 'thu_thao', email: 'thao@gmail.com', password: 'user123', displayName: 'Thu Thảo', role: 'user', points: 45 },
      { username: 'hoang_long', email: 'long@gmail.com', password: 'user123', displayName: 'Hoàng Long', role: 'user', points: 210 }
    ];
    
    for (const t of touristData) {
      const [user, created] = await User.findOrCreate({ where: { username: t.username }, defaults: t });
      
      // Force update password
      user.password = t.password;
      await user.save();
      
      if (created) {
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

    console.log('✅ All data inserted directly into database successfully!');
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
