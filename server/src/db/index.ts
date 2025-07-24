
import config from '@/config/config';
import connectMongo from './db';
import sequelize from './sql/sequelize';

// PostgreSQL connection function
async function connectPostgres() {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');

        // Sync database (create tables if they don't exist)
        if (config.server.env === 'dev') {
            await sequelize.sync({ alter: true });
            console.log('Database synchronized');
        }
    } catch (error) {
        console.error('Unable to connect to PostgreSQL:', error);
    }
}

const db = {
    mongodb: connectMongo,
    postgres: connectPostgres
}

export default db[config.db.type];
