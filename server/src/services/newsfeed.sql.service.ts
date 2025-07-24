import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";
import { IUser } from "@/schemas/UserSchema";

export const getNewsFeed = async (user: IUser | null, query: any, skip: number, limit: number): Promise<any[]> => {
    console.log('📰 NEWSFEED SQL DEBUG - getNewsFeed called');
    console.log('👤 NEWSFEED SQL DEBUG - user:', user ? `ID: ${user['_id'] || user['id']}` : 'null');
    console.log('🔍 NEWSFEED SQL DEBUG - query:', query);
    console.log('📊 NEWSFEED SQL DEBUG - skip:', skip, 'limit:', limit);

    if (!user) {
        console.log('❌ NEWSFEED SQL DEBUG - No user provided, returning empty array');
        return [];
    }

    try {
        // Handle both MongoDB (_id) and PostgreSQL (id) user IDs
        const userId = user['_id'] || user['id'];
        console.log('👤 NEWSFEED SQL DEBUG - userId extracted:', userId);

        // Get user's bookmarks (equivalent to MongoDB approach)
        console.log('🔖 NEWSFEED SQL DEBUG - Getting user bookmarks...');
        const bookmarksResult = await sequelize.query(`
            SELECT post_id FROM "Bookmarks" WHERE user_id = :userId
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });
        const bookmarkPostIds = (bookmarksResult as { post_id: number }[]).map(row => row.post_id);
        console.log('🔖 NEWSFEED SQL DEBUG - Bookmark post IDs:', bookmarkPostIds);

        // Query NewsFeed table (equivalent to MongoDB NewsFeed.aggregate)
        console.log('📰 NEWSFEED SQL DEBUG - Querying NewsFeed table...');
        const posts = await sequelize.query(`
            SELECT
                p.id,
                p.privacy,
                p.photos,
                p.description,
                p."isEdited",
                p."createdAt",
                p."updatedAt",
                p."_author_id",
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'firstname', u.firstname,
                    'lastname', u.lastname
                ) as author,
                COALESCE((SELECT COUNT(*) FROM "Comments" WHERE "_post_id" = p.id), 0) as "commentsCount",
                COALESCE((SELECT COUNT(*) FROM "Likes" WHERE target = p.id AND type = 'Post'), 0) as "likesCount",
                EXISTS(SELECT 1 FROM "Likes" WHERE target = p.id AND "user" = :userId AND type = 'Post') as "isLiked",
                (p."_author_id" = :userId) as "isOwnPost",
                ${bookmarkPostIds.length > 0
                    ? `(p.id = ANY(ARRAY[${bookmarkPostIds.join(',')}]::integer[]))`
                    : 'false'
                } as "isBookmarked"
            FROM
                "NewsFeeds" nf
            JOIN
                "Posts" p ON nf.post = p.id
            JOIN
                "Users" u ON p."_author_id" = u.id
            WHERE
                nf.follower = :userId
            ORDER BY
                nf."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { userId, skip, limit },
            type: QueryTypes.SELECT
        });

        console.log('📊 NEWSFEED SQL DEBUG - Query executed, found', posts.length, 'posts');

        // Filter out private posts (equivalent to MongoDB filtering)
        const filtered = [];
        for (const post of posts as any[]) {
            // Make sure to not include private posts of users (unless it's own post)
            if (!post.isOwnPost && post.privacy === 'private') {
                console.log('🔒 NEWSFEED SQL DEBUG - Skipping private post from other user');
                continue;
            }
            filtered.push(post);
        }

        console.log('📊 NEWSFEED SQL DEBUG - After filtering:', filtered.length, 'posts');
        if (filtered.length > 0) {
            console.log('📄 NEWSFEED SQL DEBUG - First post:', { id: filtered[0].id, description: filtered[0].description?.substring(0, 50) });
        }

        return filtered;
    } catch (error) {
        console.error("❌ NEWSFEED SQL DEBUG - Error fetching newsfeed:", error);
        throw error;
    }
};

export const populateNewsFeed = async (postId: number, authorId: number): Promise<void> => {
    console.log('📰 NEWSFEED SQL DEBUG - populateNewsFeed called');
    console.log('📄 NEWSFEED SQL DEBUG - postId:', postId, 'authorId:', authorId);

    try {
        // Get all followers of the post author
        console.log('👥 NEWSFEED SQL DEBUG - Getting followers...');
        const followersResult = await sequelize.query(`
            SELECT follower FROM "Follows" WHERE following = :authorId
        `, {
            replacements: { authorId },
            type: QueryTypes.SELECT
        });

        const followers = (followersResult as { follower: number }[]).map(row => row.follower);
        console.log('👥 NEWSFEED SQL DEBUG - Followers:', followers);

        // Create newsfeed entries for all followers + the author themselves
        const newsFeedEntries = [
            // Add to author's own feed
            { follower: authorId, post: postId, post_owner: authorId },
            // Add to all followers' feeds
            ...followers.map(followerId => ({
                follower: followerId,
                post: postId,
                post_owner: authorId
            }))
        ];

        console.log('📰 NEWSFEED SQL DEBUG - Creating', newsFeedEntries.length, 'newsfeed entries');

        if (newsFeedEntries.length > 0) {
            // Build bulk insert query
            const values = newsFeedEntries.map(entry =>
                `(${entry.follower}, ${entry.post}, ${entry.post_owner}, NOW(), NOW())`
            ).join(',');

            await sequelize.query(`
                INSERT INTO "NewsFeeds" (follower, post, post_owner, "createdAt", "updatedAt")
                VALUES ${values}
            `);

            console.log('✅ NEWSFEED SQL DEBUG - NewsFeed entries created successfully');
        }
    } catch (error) {
        console.error("❌ NEWSFEED SQL DEBUG - Error populating newsfeed:", error);
        throw error;
    }
};

export const populateNewsFeedForExistingPosts = async (): Promise<void> => {
    console.log('📰 NEWSFEED SQL DEBUG - populateNewsFeedForExistingPosts called');

    try {
        // Check if NewsFeed table is empty
        const existingCount = await sequelize.query(`
            SELECT COUNT(*) as count FROM "NewsFeeds"
        `, {
            type: QueryTypes.SELECT
        });

        const count = parseInt((existingCount[0] as any).count);
        console.log('📊 NEWSFEED SQL DEBUG - Existing NewsFeed entries:', count);

        if (count > 0) {
            console.log('✅ NEWSFEED SQL DEBUG - NewsFeed already populated, skipping');
            return;
        }

        // Get all posts
        console.log('📄 NEWSFEED SQL DEBUG - Getting all posts...');
        const posts = await sequelize.query(`
            SELECT id, "_author_id", "createdAt" FROM "Posts" ORDER BY "createdAt" ASC
        `, {
            type: QueryTypes.SELECT
        });

        console.log('📊 NEWSFEED SQL DEBUG - Found', posts.length, 'posts to process');

        // Process each post
        for (const post of posts as any[]) {
            console.log('📄 NEWSFEED SQL DEBUG - Processing post', post.id, 'by author', post._author_id);
            await populateNewsFeed(post.id, post._author_id);
        }

        console.log('✅ NEWSFEED SQL DEBUG - All existing posts processed');
    } catch (error) {
        console.error("❌ NEWSFEED SQL DEBUG - Error populating newsfeed for existing posts:", error);
        throw error;
    }
};