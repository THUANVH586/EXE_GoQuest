const { User } = require('./models');
const { connectDB } = require('./config/db');

const check = async () => {
    await connectDB();
    const users = await User.findAll({});
    console.log('COUNT:' + users.length);
    users.forEach(u => {
        console.log(`USER: ${u.username} | ROLE: ${u.role} | EMAIL: ${u.email}`);
    });
    process.exit();
};
check();
