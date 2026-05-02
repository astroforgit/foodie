import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getChats = async (userId: string, skip: number, limit: number): Promise<any[]> => {
    try {
        const chats = await sequelize.query(`
            SELECT
                m.id,
                m.text,
                m.seen,
                m."createdAt",
                json_build_object(
                    'id', fromUser.id,
                    'username', fromUser.username,
                    'profilePicture', fromUser."profilePicture"
                ) as "from",
                json_build_object(
                    'id', toUser.id,
                    'username', toUser.username,
                    'profilePicture', toUser."profilePicture"
                ) as "to",
                CASE WHEN m."from" = :userId THEN true ELSE false END as "isOwnMessage"
            FROM "Chats" c
            JOIN "Messages" m ON c.lastmessage = m.id
            JOIN "Users" fromUser ON m."from" = fromUser.id
            JOIN "Users" toUser ON m."to" = toUser.id
            WHERE :userId = ANY(c.participants)
            ORDER BY m."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { userId, skip, limit },
            type: QueryTypes.SELECT
        });
        return chats as any[];
    } catch (error) {
        console.error("Error fetching chats:", error);
        throw error;
    }
};

export const getUnreadMessagesCount = async (userId: string): Promise<number> => {
    try {
        const result = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM "Messages"
            WHERE "to" = :userId AND seen = false
        `, {
            replacements: { userId: parseInt(userId) },
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
            replacements: { userId: parseInt(userId), targetId: parseInt(targetId), skip, limit },
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

        return (result as any)[0][0];
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
            replacements: { fromId: parseInt(fromId), toId: parseInt(toId) },
            type: QueryTypes.UPDATE
        });
    } catch (error) {
        console.error("Error marking messages as read:", error);
        throw error;
    }
};

export const upsertChat = async (userId: string, targetId: string, lastMessageId: string): Promise<void> => {
    try {
        const participants = [parseInt(userId), parseInt(targetId)].sort((a, b) => a - b);
        const existing = await sequelize.query(`
            SELECT id FROM "Chats"
            WHERE participants @> ARRAY[:p1, :p2]::integer[]
            LIMIT 1
        `, {
            replacements: { p1: participants[0], p2: participants[1] },
            type: QueryTypes.SELECT
        });

        if ((existing as any[]).length > 0) {
            await sequelize.query(`
                UPDATE "Chats"
                SET lastmessage = :lastMessageId, "updatedAt" = NOW()
                WHERE id = :chatId
            `, {
                replacements: { lastMessageId: parseInt(lastMessageId), chatId: (existing as any)[0].id },
                type: QueryTypes.UPDATE
            });
        } else {
            await sequelize.query(`
                INSERT INTO "Chats" (participants, lastmessage, "createdAt", "updatedAt")
                VALUES (ARRAY[:p1, :p2]::integer[], :lastMessageId, NOW(), NOW())
            `, {
                replacements: { p1: participants[0], p2: participants[1], lastMessageId: parseInt(lastMessageId) },
                type: QueryTypes.INSERT
            });
        }
    } catch (error) {
        console.error("Error upserting chat:", error);
        throw error;
    }
};

export const getMessageById = async (messageId: string): Promise<any> => {
    try {
        const result = await sequelize.query(`
            SELECT
                m.id,
                m.text,
                m.seen,
                m."createdAt",
                json_build_object(
                    'id', fromUser.id,
                    'username', fromUser.username,
                    'profilePicture', fromUser."profilePicture"
                ) as "from",
                json_build_object(
                    'id', toUser.id,
                    'username', toUser.username,
                    'profilePicture', toUser."profilePicture"
                ) as "to"
            FROM "Messages" m
            JOIN "Users" fromUser ON m."from" = fromUser.id
            JOIN "Users" toUser ON m."to" = toUser.id
            WHERE m.id = :messageId
            LIMIT 1
        `, {
            replacements: { messageId: parseInt(messageId) },
            type: QueryTypes.SELECT
        });
        return (result as any[])[0];
    } catch (error) {
        console.error("Error fetching message by ID:", error);
        throw error;
    }
};
