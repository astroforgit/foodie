import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getUserById = async (userId: string): Promise<any> => {
    try {
        const [user] = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                firstname,
                lastname,
                "createdAt",
                "updatedAt"
            FROM
                "Users"
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
                firstname,
                lastname,
                "createdAt",
                "updatedAt"
            FROM
                "Users"
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
        const users = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                firstname,
                lastname
            FROM
                "Users"
            WHERE
                username ILIKE :searchTerm OR email ILIKE :searchTerm
            LIMIT :limit
        `, {
            replacements: { searchTerm: `%${searchTerm}%`, limit: limit },
            type: QueryTypes.SELECT
        });
        return users as any[];
    } catch (error) {
        console.error("Error searching users:", error);
        throw error;
    }
};

export const updateUser = async (userId: string, updates: any): Promise<any> => {
    try {
        const {
            username,
            firstname,
            lastname
        } = updates;

        const user = await sequelize.query(`
            UPDATE "Users"
            SET
                username = :username,
                firstname = :firstname,
                lastname = :lastname,
                "updatedAt" = NOW()
            WHERE
                id = :userId
            RETURNING *
        `, {
            replacements: { userId, username, firstname, lastname },
            type: QueryTypes.UPDATE
        });

        return (user as any[])[0];
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}
