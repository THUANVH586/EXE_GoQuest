require('dotenv').config();
const { User } = require('./models');
const { connectDB } = require('./config/db');

const renameConfusingUsers = async () => {
    try {
        await connectDB();
        
        // These are regular users whose names were used as examples and confused the user
        const renames = [
            { old: 'Thuận', new: 'Nguyễn Văn Thuận' },
            { old: 'Thu Thảo', new: 'Trần Thị Thu Thảo' },
            { old: 'Hoàng Long', new: 'Lê Hoàng Long' },
            { old: 'Minh Quân', new: 'Phạm Minh Quân' }
        ];

        for (const item of renames) {
            const users = await User.findAll({ where: { displayName: item.old, role: 'user' } });
            for (const u of users) {
                u.displayName = item.new;
                await u.save();
                console.log(`Renamed user ${item.old} to ${item.new}`);
            }
        }
        
        console.log("Done renaming confusing users.");
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
renameConfusingUsers();
