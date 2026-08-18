require('dotenv').config();
const { User, Task } = require('./models');
const { connectDB, sequelize } = require('./config/db');

const test = async () => {
    try {
        await connectDB();
        
        const tasks = await Task.findAll();
        const users = await User.findAll({
            where: { role: 'user' },
            include: ['completedTasks', 'activeMissions', 'redeemedGifts']
        });

        console.log(`Found ${users.length} users`);
        if (users.length > 0) {
            const u = users[0];
            const redeemedGiftsList = (u.redeemedGifts || []).map(g => `${g.title} (${g.UserRedeemedGift?.pointsSpent || 0}pts)`).join(', ');
            console.log("Redeemed:", redeemedGiftsList);
        }
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}
test();
