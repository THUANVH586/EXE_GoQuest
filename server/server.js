const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const app = express();

// Seed Admin Function
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ where: { role: 'admin' } });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        email: 'admin@conson.com',
        password: 'admin123',
        displayName: 'Quản trị viên',
        role: 'admin'
      });
      console.log('✅ Default admin account created (admin/admin123)');
    }
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
  }
};

// Connect to Database and Seed
connectDB().then(() => {
  seedAdmin();
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
  console.log(`\n🔗 API Endpoints:`);
  console.log(`   POST /api/auth/register - Đăng ký`);
  console.log(`   POST /api/auth/login    - Đăng nhập`);
  console.log(`   GET  /api/tasks          - Lấy danh sách nhiệm vụ`);
});

module.exports = app;
