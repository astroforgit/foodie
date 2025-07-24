import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getNotifications = async (userId: string, skip: number, limit: number): Promise<any[]> => {
    try {
        const notifications = await sequelize.query(`
            SELECT 
                n.id,
                n.type,
                n.unread,
                n.link,
                n."createdAt",
                json_build_object(
                    'id', initiator.id,
                    'username', initiator.username,
                    'firstname', initiator.firstname,
                    'lastname', initiator.lastname
                ) as initiator,
                json_build_object(
                    'id', target.id,
                    'username', target.username,
                    'firstname', target.firstname,
                    'lastname', target.lastname
                ) as target
            FROM "Notifications" n
            JOIN "Users" initiator ON n.initiator = initiator.id
            JOIN "Users" target ON n.target = target.id
            WHERE n.target = :userId
            ORDER BY n."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { userId, skip, limit },
            type: QueryTypes.SELECT
        });

        return notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        throw error;
    }
};

export const getUnreadNotifications = async (userId: string): Promise<number> => {
    try {
        const result = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM "Notifications"
            WHERE target = :userId AND unread = true
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        return parseInt((result[0] as any).count);
    } catch (error) {
        console.error("Error fetching unread notifications:", error);
        throw error;
    }
};

export const getTotalNotifications = async (userId: string): Promise<number> => {
    try {
        const result = await sequelize.query(`
            SELECT COUNT(*) as count
            FROM "Notifications"
            WHERE target = :userId
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        return parseInt((result[0] as any).count);
    } catch (error) {
        console.error("Error fetching total notifications:", error);
        throw error;
    }
};

export const markAllAsRead = async (userId: string): Promise<void> => {
    try {
        await sequelize.query(`
            UPDATE "Notifications"
            SET unread = false
            WHERE target = :userId
        `, {
            replacements: { userId },
            type: QueryTypes.UPDATE
        });
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        throw error;
    }
};

export const markAsRead = async (notificationId: string): Promise<void> => {
    try {
        await sequelize.query(`
            UPDATE "Notifications"
            SET unread = false
            WHERE id = :notificationId
        `, {
            replacements: { notificationId },
            type: QueryTypes.UPDATE
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw error;
    }
};

export const createNotification = async (data: {
    type: string;
    initiator: string;
    target: string;
    link: string;
}): Promise<any> => {
    try {
        const result = await sequelize.query(`
            INSERT INTO "Notifications" (type, initiator, target, link, "createdAt", "updatedAt")
            VALUES (:type, :initiator, :target, :link, NOW(), NOW())
            RETURNING *
        `, {
            replacements: data,
            type: QueryTypes.INSERT
        });

        return result[0];
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
};
