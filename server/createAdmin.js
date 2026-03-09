require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB...');

        const adminData = {
            username: 'admin',
            email: 'admin@conson.com',
            password: 'admin123',
            displayName: 'Quản trị viên',
            role: 'admin'
        };

        const existingAdmin = await User.findOne({
            $or: [
                { email: adminData.email },
                { username: adminData.username }
            ]
        });

        if (existingAdmin) {
            console.log('Admin already exists. Updating password...');
            existingAdmin.password = adminData.password;
            existingAdmin.role = 'admin'; // Ensure role is admin
            await existingAdmin.save();
            console.log('Admin updated successfully!');
        } else {
            const admin = new User(adminData);
            await admin.save();
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
