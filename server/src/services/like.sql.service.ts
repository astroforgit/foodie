import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const createLike = async (userId: string, postId: string) => {
    try {
        await sequelize.query(`
            INSERT INTO likes (user_id, post_id) VALUES (:userId, :postId)
        `, {
            replacements: { userId, postId },
            type: QueryTypes.INSERT
        });
    } catch (error) {
        console.error("Error creating like:", error);
        throw error;
    }
}

export const deleteLike = async (userId: string, postId: string) => {
    try {
        await sequelize.query(`
            DELETE FROM likes WHERE user_id = :userId AND post_id = :postId
        `, {
            replacements: { userId, postId },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting like:", error);
        throw error;
    }
}