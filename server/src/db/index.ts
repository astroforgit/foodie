
import config from '@/config/config';
import connectMongo from './db';
import sequelize from './sql/sequelize';

// PostgreSQL connection function
async function connectPostgres() {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL connected successfully');

        // Import models to register them with Sequelize
        await import('@/models/User');
        await import('@/models/Post');
        await import('@/models/Follow');
        await import('@/models/Notification');
        await import('@/models/Message');
        await import('@/models/Like');
        await import('@/models/Comment');
        await import('@/models/NewsFeed');
        await import('@/models/Bookmark');
        await import('@/models/Chat');
        console.log('Models loaded');

        // Sync database only if DATABASE_SYNC is enabled
        if (config.db.sync) {
            await sequelize.sync({ alter: true });
            console.log('Database synchronized');

            // Populate NewsFeed for existing posts
            console.log('Populating NewsFeed for existing posts...');
            const { populateNewsFeedForExistingPosts } = await import('@/services/newsfeed.sql.service');
            await populateNewsFeedForExistingPosts();
            console.log('NewsFeed population completed');
        } else {
            console.log('Database sync skipped (DATABASE_SYNC=false)');
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
