import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getUnreadMessagesCount = async (userId: string): Promise<number> => {
    try {
        const result = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM "Messages"
            WHERE "to" = :userId AND seen = false
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        return parseInt((result[0] as any).count);
    } catch (error) {
        console.error("Error fetching unread messages count:", error);
        throw error;
    }
};

export const getMessages = async (userId: string, targetId: string, skip: number, limit: number): Promise<any[]> => {
    try {
        const messages = await sequelize.query(`
            SELECT 
                m.id,
                m.text,
                m.seen,
                m."createdAt",
                json_build_object(
                    'id', fromUser.id,
                    'username', fromUser.username,
                    'firstname', fromUser.firstname,
                    'lastname', fromUser.lastname
                ) as "from",
                CASE WHEN m."from" = :userId THEN true ELSE false END as "isOwnMessage"
            FROM "Messages" m
            JOIN "Users" fromUser ON m."from" = fromUser.id
            WHERE (m."from" = :userId AND m."to" = :targetId) 
               OR (m."from" = :targetId AND m."to" = :userId)
            ORDER BY m."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { userId, targetId, skip, limit },
            type: QueryTypes.SELECT
        });

        return messages;
    } catch (error) {
        console.error("Error fetching messages:", error);
        throw error;
    }
};

export const createMessage = async (data: {
    from: string;
    to: string;
    text: string;
}): Promise<any> => {
    try {
        const result = await sequelize.query(`
            INSERT INTO "Messages" ("from", "to", text, seen, "createdAt", "updatedAt")
            VALUES (:from, :to, :text, false, NOW(), NOW())
            RETURNING *
        `, {
            replacements: data,
            type: QueryTypes.INSERT
        });

        return result[0];
    } catch (error) {
        console.error("Error creating message:", error);
        throw error;
    }
};

export const markMessagesAsRead = async (fromId: string, toId: string): Promise<void> => {
    try {
        await sequelize.query(`
            UPDATE "Messages"
            SET seen = true
            WHERE "from" = :fromId AND "to" = :toId AND seen = false
        `, {
            replacements: { fromId, toId },
            type: QueryTypes.UPDATE
        });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        throw error;
    }
};
