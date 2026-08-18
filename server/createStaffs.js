require('dotenv').config();
const { User } = require('./models');
const { connectDB, sequelize } = require('./config/db');

const createStaffs = async () => {
    try {
        await connectDB();
        
        // Sync models to ensure tables exist
        await sequelize.sync();

        // Xoá các tài khoản staff1->staff5 cũ để đỡ rác database
        await User.destroy({
            where: {
                username: ['staff1', 'staff2', 'staff3', 'staff4', 'staff5']
            }
        });
        console.log('Đã xoá các tài khoản staff cũ (staff1-staff5).');

        const staffs = [
            { username: 'thuan', email: 'thuan@cantho.com', password: 'thuan123', displayName: 'Thuận', role: 'staff' },
            { username: 'thong', email: 'thong@cantho.com', password: 'thong123', displayName: 'Thông', role: 'staff' },
            { username: 'nguyen', email: 'nguyen@cantho.com', password: 'nguyen123', displayName: 'Nguyên', role: 'staff' },
            { username: 'quan', email: 'quan@cantho.com', password: 'quan123', displayName: 'Quân', role: 'staff' },
            { username: 'hung', email: 'hung@cantho.com', password: 'hung123', displayName: 'Hùng', role: 'staff' },
        ];

        console.log('Bắt đầu tạo tài khoản staff mới...');
        
        for (const staff of staffs) {
            const existingUser = await User.findOne({
                where: {
                    [require('sequelize').Op.or]: [
                        { email: staff.email },
                        { username: staff.username }
                    ]
                }
            });

            if (!existingUser) {
                await User.create(staff);
                console.log(`✅ Đã tạo thành công: ${staff.displayName} (Username: ${staff.username})`);
            } else {
                console.log(`⚠️ Tài khoản ${staff.username} đã tồn tại, tiến hành cập nhật mật khẩu...`);
                existingUser.password = staff.password;
                existingUser.displayName = staff.displayName;
                await existingUser.save();
                console.log(`✅ Đã cập nhật: ${staff.displayName} (Username: ${staff.username})`);
            }
        }

        console.log('Hoàn thành tạo tài khoản staff tiếng Việt!');
        process.exit();
    } catch (error) {
        console.error('Lỗi khi tạo staff:', error);
        process.exit(1);
    }
};

createStaffs();
