import { Sequelize } from 'sequelize';
import config from '@/config/config';

// Use connection string if provided, otherwise build from individual parts
const connectionString = config.postgres.connectionString ||
  config.neonPostgres.connectionString ||
  `postgres://${config.postgres.user}:${config.postgres.password}@${config.postgres.host}:5432/${config.postgres.dbName}`;

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: config.server.env === 'dev' ? console.log : false,
  dialectOptions: {
    ssl: connectionString.includes('sslmode=require') ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

export default sequelize;