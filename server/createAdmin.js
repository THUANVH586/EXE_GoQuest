require('dotenv').config();
const { User } = require('./models');
const { connectDB, sequelize } = require('./config/db');

const createAdmin = async () => {
    try {
        await connectDB();
        
        // Sync models to ensure tables exist
        await sequelize.sync();

        const adminData = {
            username: 'admin',
            email: 'admin@conson.com',
            password: 'admin123',
            displayName: 'Quản trị viên',
            role: 'admin'
        };

        const existingAdmin = await User.findOne({
            where: {
                [require('sequelize').Op.or]: [
                    { email: adminData.email },
                    { username: adminData.username }
                ]
            }
        });

        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = adminData.password;
            existingAdmin.role = 'admin'; // Ensure role is admin
            await existingAdmin.save();
            console.log('Admin updated successfully!');
        } else {
            await User.create(adminData);
            console.log('Admin created successfully!');
        }

        console.log('---------------------------');
        console.log('Email: ' + adminData.email);
        console.log('Username: ' + adminData.username);
        console.log('Password: ' + adminData.password);
        console.log('---------------------------');

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

createAdmin();
