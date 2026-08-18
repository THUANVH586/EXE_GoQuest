require('dotenv').config();
const { User } = require('./models');
const { connectDB } = require('./config/db');

const updateStaff = async () => {
    try {
        await connectDB();
        const staffMembers = await User.findAll({ where: { role: 'staff' }, order: [['createdAt', 'ASC']] });
        const newNames = ['Kỳ Quân', 'Phương Quyên', 'Duy Anh', 'Quỳnh Anh', 'Lilda Ngô'];
        
        for (let i = 0; i < Math.min(staffMembers.length, newNames.length); i++) {
            staffMembers[i].displayName = newNames[i];
            await staffMembers[i].save();
            console.log(`Updated staff ${i+1} to ${newNames[i]}`);
        }
        
        // If there are fewer than 5 staffs, maybe we should create them? 
        // The user said "sửa lại tên của 5 staff thành...".
        // Let's assume there are exactly 5 or we just update the existing ones.
        console.log("Done updating staff names.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
updateStaff();
