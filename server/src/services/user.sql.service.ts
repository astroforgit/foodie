import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getUserById = async (userId: string): Promise<any> => {
    try {
        const [user] = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                profile_picture as "profilePicture",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM
                users
            WHERE
                id = :userId
        `, {
            replacements: { userId: userId },
            type: QueryTypes.SELECT
        });
        return user[0];
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw error;
    }
};

export const getUserByUsername = async (username: string): Promise<any> => {
    try {
        const [user] = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                profile_picture as "profilePicture",
                created_at as "createdAt",
                updated_at as "updatedAt"
            FROM
                users
            WHERE
                username = :username
        `, {
            replacements: { username: username },
            type: QueryTypes.SELECT
        });
        return user[0];
    } catch (error) {
        console.error("Error fetching user by username:", error);
        throw error;
    }
};

export const searchUsers = async (searchTerm: string, limit: number = 10): Promise<any[]> => {
    try {
        const [users] = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                profile_picture as "profilePicture"
            FROM
                users
            WHERE
                username ILIKE :searchTerm OR email ILIKE :searchTerm
            LIMIT :limit
        `, {
            replacements: { searchTerm: `%${searchTerm}%`, limit: limit },
            type: QueryTypes.SELECT
        });
        return users;
    } catch (error) {
        console.error("Error searching users:", error);
        throw error;
    }
};

export const updateUser = async (userId: string, updates: any): Promise<any> => {
    try {
        const {
            username,
            profilePicture
        } = updates;

        const [user] = await sequelize.query(`
            UPDATE users
            SET
                username = :username,
                profile_picture = :profilePicture,
                updated_at = NOW()
            WHERE
                id = :userId
            RETURNING *
        `, {
            replacements: { userId, username, profilePicture },
            type: QueryTypes.UPDATE
        });

        return user[0];
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}
