
import config from '@/config/config';
import connectMongo from './db';
import sequelize from './sql/sequelize';

const db = {
    mongo: connectMongo,
    postgres: sequelize
}

export default db[config.db.type];
