const { Sequelize } = require('sequelize');

let sequelize;

if (process.env.DATABASE_URL) {
    // For Production (Render/PostgreSQL)
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    // For Local (SQL Server)
    sequelize = new Sequelize(
        process.env.DB_NAME || 'GoQuestDB',
        process.env.DB_USER || 'sa',
        process.env.DB_PASSWORD || '123456',
        {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 1433,
            dialect: 'mssql',
            dialectOptions: {
                options: {
                    encrypt: true,
                    trustServerCertificate: true
                }
            },
            logging: false
        }
    );
}

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log(`📦 ${sequelize.getDialect().toUpperCase()} Connected Successfully!`);
        
        // Sync models to create tables automatically
        await sequelize.sync({ alter: true }); 
        console.log('🔄 Database synced successfully');
    } catch (error) {
        console.error(`❌ Database connection error: ${error.message}`);
    }
};

module.exports = { sequelize, connectDB };
