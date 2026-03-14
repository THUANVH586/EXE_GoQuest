require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const User = require('./models/User');

const app = express();

// Kết nối MongoDB
connectDB();

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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      status: 'ok',
      message: 'Cồn Sơn Tourism API is running with MongoDB!',
      users: userCount
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Database: MongoDB Atlas`);
  console.log(`\n🔗 API Endpoints:`);
  console.log(`   POST /api/auth/register - Đăng ký`);
  console.log(`   POST /api/auth/login    - Đăng nhập`);
  console.log(`   GET  /api/tasks          - Lấy danh sách nhiệm vụ`);
});

module.exports = app;
