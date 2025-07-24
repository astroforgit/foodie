import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const checkLike = async (userId: string, targetId: string, type: string = 'Post'): Promise<boolean> => {
    try {
        const result = await sequelize.query(`
            SELECT 1 FROM "Likes" WHERE "user" = :userId AND target = :targetId AND type = :type
        `, {
            replacements: { userId: parseInt(userId), targetId: parseInt(targetId), type },
            type: QueryTypes.SELECT
        });
        return result.length > 0;
    } catch (error) {
        console.error("Error checking like:", error);
        throw error;
    }
}

export const createLike = async (userId: string, targetId: string, type: string = 'Post') => {
    try {
        await sequelize.query(`
            INSERT INTO "Likes" ("user", target, type, "createdAt", "updatedAt")
            VALUES (:userId, :targetId, :type, NOW(), NOW())
        `, {
            replacements: { userId: parseInt(userId), targetId: parseInt(targetId), type },
            type: QueryTypes.INSERT
        });
    } catch (error) {
        console.error("Error creating like:", error);
        throw error;
    }
}

export const deleteLike = async (userId: string, targetId: string, type: string = 'Post') => {
    try {
        await sequelize.query(`
            DELETE FROM "Likes" WHERE "user" = :userId AND target = :targetId AND type = :type
        `, {
            replacements: { userId: parseInt(userId), targetId: parseInt(targetId), type },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting like:", error);
        throw error;
    }
}

export const getLikesCount = async (targetId: string, type: string = 'Post'): Promise<number> => {
    try {
        const result = await sequelize.query(`
            SELECT COUNT(*) as count FROM "Likes" WHERE target = :targetId AND type = :type
        `, {
            replacements: { targetId: parseInt(targetId), type },
            type: QueryTypes.SELECT
        });
        return parseInt((result[0] as any).count);
    } catch (error) {
        console.error("Error getting likes count:", error);
        throw error;
    }
}