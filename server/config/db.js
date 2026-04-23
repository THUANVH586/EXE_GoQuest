const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME || 'GoQuestDB',
    process.env.DB_USER || 'sa',
    process.env.DB_PASSWORD || 'your_password',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 1433,
        dialect: 'mssql',
        dialectOptions: {
            options: {
                encrypt: true, // "Mandatory" in SSMS
                trustServerCertificate: true
            }
        },
        logging: false
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('📦 SQL Server Connected (Sequelize)...');
        
        // Sync models
        // await sequelize.sync({ alter: true }); 
        // console.log('🔄 Database synced successfully');
    } catch (error) {
        console.error(`Error connecting to SQL Server: ${error.message}`);
        console.log('⚠️ Running without database connection');
    }
};

module.exports = { sequelize, connectDB };
