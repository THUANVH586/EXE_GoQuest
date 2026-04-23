require('dotenv').config();
const { User, Task, Gift, sequelize } = require('./models');
const { connectDB } = require('./config/db');

const sampleTasks = [
    {
        title: 'Thưởng thức Bánh Xèo',
        description: 'Đến quầy bánh dân gian trải nghiệm món bánh xèo giòn rụm đặc trưng miền Tây',
        type: 'food',
        category: 'short-term',
        locationName: 'Quầy Cô Ba',
        locationDescription: 'Đầu đường chính Cồn Sơn',
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
        locationName: 'Quầy Chú Năm',
        locationDescription: 'Khu thủ công mỹ nghệ',
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
        locationName: 'Quầy Bánh Tráng Trộn',
        locationDescription: 'Khu ẩm thực đường chính',
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
        locationName: 'Toàn bộ Cồn Sơn',
        locationDescription: '',
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
        locationName: 'Toàn bộ Cồn Sơn',
        locationDescription: '',
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
        locationName: 'Quầy Chè Cô Tư',
        locationDescription: 'Gần bến thuyền',
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
        locationName: 'Khu Workshop',
        locationDescription: 'Nhà văn hóa Cồn Sơn',
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
        
        // Sync database (caution: sync({ force: true }) drops tables)
        await sequelize.sync({ force: true });
        console.log('🗑️ Database cleared and re-synced');

        // Seed tasks
        await Task.bulkCreate(sampleTasks);
        console.log('✅ Tasks seeded');

        // Seed gifts
        await Gift.bulkCreate(sampleGifts);
        console.log('✅ Gifts seeded');

        // Create admin
        const adminSecret = 'admin123';
        await User.create({
            username: 'admin',
            email: 'admin@conson.com',
            password: adminSecret,
            displayName: 'Quản trị viên',
            role: 'admin'
        });
        console.log('🔑 Admin account created: admin / admin123');

        console.log('🎉 Data seeding completed!');
        process.exit();
    } catch (error) {
        console.error(`❌ Error seeding data: ${error.message}`);
        process.exit(1);
    }
};

seedData();
