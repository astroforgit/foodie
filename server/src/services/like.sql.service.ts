import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const checkLike = async (userId: string, targetId: string, type: string = 'Post'): Promise<boolean> => {
    try {
        const userIdInt = parseInt(userId);
        const targetIdInt = parseInt(targetId);

        console.log('🔍 LIKE SQL DEBUG - checkLike called');
        console.log('👤 LIKE SQL DEBUG - userId:', userId, '→', userIdInt);
        console.log('🎯 LIKE SQL DEBUG - targetId:', targetId, '→', targetIdInt);
        console.log('📝 LIKE SQL DEBUG - type:', type);

        const result = await sequelize.query(`
            SELECT 1 FROM "Likes" WHERE "user" = :userId AND target = :targetId AND type = :type
        `, {
            replacements: { userId: userIdInt, targetId: targetIdInt, type },
            type: QueryTypes.SELECT
        });

        console.log('📊 LIKE SQL DEBUG - Query result length:', result.length);
        const isLiked = result.length > 0;
        console.log('❤️ LIKE SQL DEBUG - Is liked:', isLiked);

        return isLiked;
    } catch (error) {
        console.error("❌ LIKE SQL DEBUG - Error checking like:", error);
        throw error;
    }
}

export const createLike = async (userId: string, targetId: string, type: string = 'Post') => {
    try {
        const userIdInt = parseInt(userId);
        const targetIdInt = parseInt(targetId);

        console.log('➕ LIKE SQL DEBUG - createLike called');
        console.log('👤 LIKE SQL DEBUG - userId:', userId, '→', userIdInt);
        console.log('🎯 LIKE SQL DEBUG - targetId:', targetId, '→', targetIdInt);
        console.log('📝 LIKE SQL DEBUG - type:', type);

        const query = `INSERT INTO "Likes" ("user", target, type, "createdAt", "updatedAt") VALUES (:userId, :targetId, :type, NOW(), NOW())`;
        console.log('🔍 LIKE SQL DEBUG - Query:', query);
        console.log('🔍 LIKE SQL DEBUG - Replacements:', { userId: userIdInt, targetId: targetIdInt, type });

        await sequelize.query(query, {
            replacements: { userId: userIdInt, targetId: targetIdInt, type },
            type: QueryTypes.INSERT
        });

        console.log('✅ LIKE SQL DEBUG - Like created successfully');
    } catch (error) {
        console.error("❌ LIKE SQL DEBUG - Error creating like:", error);
        console.error("❌ LIKE SQL DEBUG - Error details:", error.message);
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
        const targetIdInt = parseInt(targetId);

        console.log('🔢 LIKE SQL DEBUG - getLikesCount called');
        console.log('🎯 LIKE SQL DEBUG - targetId:', targetId, '→', targetIdInt);
        console.log('📝 LIKE SQL DEBUG - type:', type);

        const result = await sequelize.query(`
            SELECT COUNT(*) as count FROM "Likes" WHERE target = :targetId AND type = :type
        `, {
            replacements: { targetId: targetIdInt, type },
            type: QueryTypes.SELECT
        });

        const count = parseInt((result[0] as any).count);
        console.log('📊 LIKE SQL DEBUG - Likes count result:', count);

        return count;
    } catch (error) {
        console.error("❌ LIKE SQL DEBUG - Error getting likes count:", error);
        throw error;
    }
}