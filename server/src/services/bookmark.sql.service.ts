import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getBookmarks = async (userId: string, skip: number, limit: number): Promise<any[]> => {
    try {
        const bookmarks = await sequelize.query(`
            SELECT
                b.id,
                b."createdAt",
                true as "isBookmarked",
                json_build_object(
                    'id', p.id,
                    'description', p.description,
                    'photos', p.photos
                ) as post
            FROM "Bookmarks" b
            JOIN "Posts" p ON b.post_id = p.id
            WHERE b.user_id = :userId
            ORDER BY b."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { userId, skip, limit },
            type: QueryTypes.SELECT
        });
        return bookmarks as any[];
    } catch (error) {
        console.error("Error fetching bookmarks:", error);
        throw error;
    }
}

export const checkBookmark = async (userId: string, postId: string): Promise<boolean> => {
    try {
        const result = await sequelize.query(`
            SELECT 1 FROM "Bookmarks" WHERE user_id = :userId AND post_id = :postId LIMIT 1
        `, {
            replacements: { userId: parseInt(userId), postId: parseInt(postId) },
            type: QueryTypes.SELECT
        });
        return (result as any[]).length > 0;
    } catch (error) {
        console.error("Error checking bookmark:", error);
        throw error;
    }
}

export const createBookmark = async (userId: string, postId: string) => {
    try {
        await sequelize.query(`
            INSERT INTO "Bookmarks" (user_id, post_id, "createdAt", "updatedAt") VALUES (:userId, :postId, NOW(), NOW())
        `, {
            replacements: { userId: parseInt(userId), postId: parseInt(postId) },
            type: QueryTypes.INSERT
        });
    } catch (error) {
        console.error("Error creating bookmark:", error);
        throw error;
    }
}

export const deleteBookmark = async (userId: string, postId: string) => {
    try {
        await sequelize.query(`
            DELETE FROM "Bookmarks" WHERE user_id = :userId AND post_id = :postId
        `, {
            replacements: { userId: parseInt(userId), postId: parseInt(postId) },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting bookmark:", error);
        throw error;
    }
}