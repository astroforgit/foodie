
import { Sequelize } from 'sequelize';
import config from '@/config/config';

const sequelize = new Sequelize(config.postgres.dbName, config.postgres.user, config.postgres.password, {
    host: config.postgres.host,
    dialect: 'postgres'
});

export default sequelize;
