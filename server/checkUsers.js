require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const check = async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const users = await User.find({});
    console.log('COUNT:' + users.length);
    users.forEach(u => {
        console.log(`USER: ${u.username} | ROLE: ${u.role} | EMAIL: ${u.email}`);
    });
    process.exit();
};
check();
