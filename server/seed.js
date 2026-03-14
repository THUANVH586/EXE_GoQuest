require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Task = require('./models/Task');
const Gift = require('./models/Gift');
const connectDB = require('./config/db');

const sampleTasks = [
    {
        title: 'Thưởng thức Bánh Xèo',
        description: 'Đến quầy bánh dân gian trải nghiệm món bánh xèo giòn rụm đặc trưng miền Tây',
        type: 'food',
        category: 'short-term',
        location: { name: 'Quầy Cô Ba', description: 'Đầu đường chính Cồn Sơn' },
        duration: 20,
        points: 15,
        icon: '🥞',
        order: 1
    },
    {
        title: 'Trang trí Nón Lá',
        description: 'Vẽ và trang trí nón lá theo phong cách riêng của bạn',
        type: 'craft',
        category: 'short-term',
        location: { name: 'Quầy Chú Năm', description: 'Khu thủ công mỹ nghệ' },
        duration: 30,
        points: 25,
        icon: '🎨',
        order: 2
    },
    {
        title: 'Trải nghiệm Bán Hàng',
        description: 'Trải nghiệm làm người đứng quầy bán bánh tráng trộn trong 30 phút',
        type: 'community',
        category: 'short-term',
        location: { name: 'Quầy Bánh Tráng Trộn', description: 'Khu ẩm thực đường chính' },
        duration: 30,
        points: 50,
        icon: '🏪',
        order: 3
    },
    {
        title: 'Hành trình khám phá',
        description: 'Khám phá Cồn Sơn bằng cách di chuyển và tích lũy ít nhất 2000m',
        type: 'health',
        category: 'long-term',
        location: { name: 'Toàn bộ Cồn Sơn' },
        duration: 0,
        points: 200,
        icon: '🏃',
        order: 4
    },
    {
        title: 'Bảo vệ Môi trường',
        description: 'Mang theo bình nước cá nhân, không sử dụng ly nhựa trong suốt chuyến tham quan',
        type: 'environment',
        category: 'long-term',
        location: { name: 'Toàn bộ Cồn Sơn' },
        duration: 0,
        points: 75,
        icon: '🌿',
        order: 5
    },
    {
        title: 'Thưởng thức Chè Bưởi',
        description: 'Nếm thử món chè bưởi mát lạnh đặc sản Cồn Sơn',
        type: 'food',
        category: 'short-term',
        location: { name: 'Quầy Chè Cô Tư', description: 'Gần bến thuyền' },
        duration: 15,
        points: 10,
        icon: '🍨',
        order: 6
    },
    {
        title: 'Học làm Bánh Dân Gian',
        description: 'Tham gia workshop học làm bánh lá dừa truyền thống',
        type: 'craft',
        category: 'short-term',
        location: { name: 'Khu Workshop', description: 'Nhà văn hóa Cồn Sơn' },
        duration: 45,
        points: 35,
        icon: '🍰',
        order: 7
    }
];

const sampleGifts = [
    {
        title: 'Nón lá Cồn Sơn',
        description: 'Chiếc nón lá truyền thống được các nghệ nhân Cồn Sơn đan thủ công.',
        pointsRequired: 200,
        icon: '👒',
        stock: 50
    },
    {
        title: 'Móc khóa Gỗ',
        description: 'Móc khóa gỗ khắc hình lưu niệm Cồn Sơn độc đáo.',
        pointsRequired: 50,
        icon: '🔑',
        stock: 100
    },
    {
        title: 'Túi vải Canvas',
        description: 'Túi vải thân thiện môi trường với họa tiết sống xanh.',
        pointsRequired: 150,
        icon: '🛍️',
        stock: 30
    },
    {
        title: 'Bộ Bánh Dân Gian',
        description: 'Hộp quà gồm các loại bánh dân gian đặc sản địa phương.',
        pointsRequired: 300,
        icon: '🍱',
        stock: 20
    }
];

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Task.deleteMany({});
        console.log('🗑️  Tasks cleared');

        // Seed tasks
        await Task.insertMany(sampleTasks);
        console.log('✅ Tasks seeded');

        // Seed gifts
        await Gift.deleteMany({});
        await Gift.insertMany(sampleGifts);
        console.log('✅ Gifts seeded');

        // Create admin if not exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const adminSecret = 'admin123';
            const admin = new User({
                username: 'admin',
                email: 'admin@conson.com',
                password: adminSecret,
                displayName: 'Quản trị viên',
                role: 'admin'
            });
            await admin.save();
            console.log('🔑 Admin account created: admin / admin123');
        } else {
            console.log('ℹ️ Admin account already exists');
        }

        console.log('🎉 Data seeding completed!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error seeding data: ${error.message}`);
        process.exit(1);
    }
};

seedData();
