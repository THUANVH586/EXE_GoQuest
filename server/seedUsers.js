require('dotenv').config();
const { User, Task, Gift, UserCompletedTask, UserActiveMission, UserRedeemedGift } = require('./models');
const { connectDB, sequelize } = require('./config/db');

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const lastNames = ['Hải', 'Thành', 'Tuấn', 'Tú', 'Hùng', 'Bình', 'Hương', 'Lan', 'Hoa', 'Mai', 'Linh', 'My', 'Khang', 'Khôi', 'Trí', 'Phúc', 'An', 'Minh'];

function getRandomName() {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
}

const seedRandomUsers = async () => {
    try {
        await connectDB();
        await sequelize.sync();

        console.log('Bắt đầu xoá dữ liệu giả lập cũ (nếu có)...');
        await User.destroy({ where: { role: 'user' } });
        
        console.log('Lấy thông tin Tasks và Gifts...');
        const allTasks = await Task.findAll();
        const allGifts = await Gift.findAll();

        if (allTasks.length === 0 || allGifts.length === 0) {
            console.log('Vui lòng chạy file seed.js để tạo Tasks và Gifts trước!');
            process.exit(0);
        }

        const usersData = [];
        for (let i = 1; i <= 25; i++) {
            const displayName = getRandomName();
            const username = `user${i}_${Math.floor(Math.random() * 1000)}`;
            usersData.push({
                username: username,
                email: `${username}@gmail.com`,
                password: 'password123',
                displayName: displayName,
                role: 'user',
                points: Math.floor(Math.random() * 300) + 100, // Điểm dư dả
                steps: Math.floor(Math.random() * 8000),
                distance: parseFloat((Math.random() * 8).toFixed(2)),
                usingPersonalBottle: Math.random() > 0.3
            });
        }

        console.log('Đang tạo 25 users ngẫu nhiên...');
        const createdUsers = await User.bulkCreate(usersData);

        const completedTasksData = [];
        const activeMissionsData = [];
        const redeemedGiftsData = [];

        console.log('Đang tạo các hoạt động (nhiệm vụ, đổi quà) cho user...');
        
        for (let idx = 0; idx < createdUsers.length; idx++) {
            const user = createdUsers[idx];
            let numCompleted;
            
            // 8 user đầu tiên sẽ HOÀN THÀNH TẤT CẢ nhiệm vụ (Full clear)
            if (idx < 8) {
                numCompleted = allTasks.length;
            } else {
                // Các user còn lại hoàn thành 1 phần
                numCompleted = Math.floor(Math.random() * (allTasks.length - 1)) + 1;
            }

            const shuffledTasks = [...allTasks].sort(() => 0.5 - Math.random());
            
            for (let i = 0; i < numCompleted; i++) {
                // Thêm vào bảng CompletedTask
                completedTasksData.push({
                    UserId: user.id,
                    TaskId: shuffledTasks[i].id,
                    completedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000))
                });
                
                // Đồng thời cũng phải lưu vào bảng ActiveMission với status 'completed'
                activeMissionsData.push({
                    UserId: user.id,
                    TaskId: shuffledTasks[i].id,
                    status: 'completed',
                    startTime: new Date(Date.now() - Math.floor(Math.random() * 200000000))
                });
            }

            // Nhiệm vụ đang làm dở (nếu chưa full)
            if (numCompleted < allTasks.length) {
                const numActive = Math.floor(Math.random() * (allTasks.length - numCompleted));
                for (let i = numCompleted; i < numCompleted + numActive; i++) {
                    if (shuffledTasks[i]) {
                        activeMissionsData.push({
                            UserId: user.id,
                            TaskId: shuffledTasks[i].id,
                            status: Math.random() > 0.5 ? 'assigned' : 'started',
                            startTime: new Date(Date.now() - Math.floor(Math.random() * 100000000))
                        });
                    }
                }
            }

            // Đổi quà
            const numGifts = Math.floor(Math.random() * 3);
            const shuffledGifts = [...allGifts].sort(() => 0.5 - Math.random());
            for (let i = 0; i < numGifts; i++) {
                redeemedGiftsData.push({
                    UserId: user.id,
                    GiftId: shuffledGifts[i].id,
                    giftTitle: shuffledGifts[i].title,
                    pointsSpent: shuffledGifts[i].pointsRequired,
                    redeemedAt: new Date(Date.now() - Math.floor(Math.random() * 5000000000))
                });
            }
        }

        await UserCompletedTask.bulkCreate(completedTasksData);
        await UserActiveMission.bulkCreate(activeMissionsData);
        await UserRedeemedGift.bulkCreate(redeemedGiftsData);

        console.log('✅ Hoàn tất! Đã tạo xong 25 tài khoản (trong đó có 8 tài khoản ĐÃ HOÀN THÀNH TOÀN BỘ nhiệm vụ).');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi trong quá trình tạo data:', error);
        process.exit(1);
    }
};

seedRandomUsers();
