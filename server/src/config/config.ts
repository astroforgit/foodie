import connectMongo from 'connect-mongo';
import session from 'express-session';
import mongoose from 'mongoose';
import path from 'path';

const MongoStore = connectMongo(session);
const env = process.env.NODE_ENV || 'dev';

if (env === 'dev') {
  require('dotenv').config({
    path: path.join(__dirname, '../../.env-dev')
  })
}

const dbType = process.env.DB_TYPE || 'mongodb';

export default {
  server: {
    env,
    port: process.env.PORT || 9000,
  },
  db: {
    type: dbType,
    sync: process.env.DATABASE_SYNC === 'true',
  },
  postgres: {
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    dbName: process.env.POSTGRES_DB_NAME || 'foodie',
    // Full connection string option (takes precedence if provided)
    connectionString: process.env.POSTGRES_CONNECTION_STRING,
  },
  // Neon PostgreSQL configuration
  neonPostgres: {
    connectionString: process.env.NEON_POSTGRES_URL || 'postgresql://neondb_owner:npg_Et9BkvL5ypDb@ep-proud-mouse-adxpee1a-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
    dbName: process.env.MONGODB_DB_NAME
  },
  session: {
    key: process.env.SESSION_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      secure: env !== 'dev',
      sameSite: env === 'dev' ? 'strict' : 'none',
      httpOnly: env !== 'dev'
    }, //14 days expiration
    // Only use MongoStore if using MongoDB
    ...(dbType === 'mongodb' && {
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
        collection: 'session'
      })
    })
  },
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
    preflightContinue: true
  },
  gCloudStorage: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  }
}
