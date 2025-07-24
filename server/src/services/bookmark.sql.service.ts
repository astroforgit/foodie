import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const createBookmark = async (userId: string, postId: string) => {
    try {
        await sequelize.query(`
            INSERT INTO bookmarks (user_id, post_id) VALUES (:userId, :postId)
        `, {
            replacements: { userId, postId },
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
            DELETE FROM bookmarks WHERE user_id = :userId AND post_id = :postId
        `, {
            replacements: { userId, postId },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting bookmark:", error);
        throw error;
    }
}