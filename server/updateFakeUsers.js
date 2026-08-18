require('dotenv').config();
const { User } = require('./models');
const { connectDB, sequelize } = require('./config/db');

const removeAccents = (str) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

const updateUsers = async () => {
    try {
        await connectDB();
        
        const users = await User.findAll({ where: { role: 'user' } });
        
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (u.displayName) {
                // Generate a realistic username
                let cleanName = removeAccents(u.displayName).toLowerCase().replace(/\s+/g, '');
                
                // Add some random realistic suffix like birth year or numbers
                const suffix = Math.floor(Math.random() * 100);
                const year = 1980 + Math.floor(Math.random() * 20); // 1980 - 1999
                
                const r = Math.random();
                let username = '';
                if (r < 0.3) username = `${cleanName}${year}`;
                else if (r < 0.6) username = `${cleanName}`;
                else username = `${cleanName}.${suffix}`;

                // Add random realistic email domains
                const domains = ['@gmail.com', '@outlook.com', '@hotmail.com', '@icloud.com'];
                const domain = domains[Math.floor(Math.random() * domains.length)];
                let email = `${username}${domain}`;

                // Prevent duplicates
                let exists = await User.findOne({ where: { username }});
                if (exists && exists.id !== u.id) {
                    username = `${username}_${i}`;
                    email = `${username}${domain}`;
                }

                u.username = username;
                u.email = email;
                await u.save();
                console.log(`Updated ${u.displayName} -> ${u.username} / ${u.email}`);
            }
        }
        console.log("All done!");
        process.exit(0);
    } catch (e) {
        console.error("ERROR:", e);
        process.exit(1);
    }
}
updateUsers();
