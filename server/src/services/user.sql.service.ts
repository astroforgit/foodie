import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const getUserById = async (userId: string): Promise<any> => {
    try {
        const users = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                firstname,
                lastname,
                info,
                "profilePicture",
                "coverPhoto",
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
        return users[0];
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        throw error;
    }
};

export const getUserByUsername = async (username: string): Promise<any> => {
    try {
        const users = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                firstname,
                lastname,
                info,
                "profilePicture",
                "coverPhoto",
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
        return users[0];
    } catch (error) {
        console.error("Error fetching user by username:", error);
        throw error;
    }
};

export const searchUsers = async (searchTerm: string, skip: number = 0, limit: number = 10): Promise<any[]> => {
    try {
        const users = await sequelize.query(`
            SELECT
                id,
                email,
                username,
                firstname,
                lastname,
                info,
                "profilePicture",
                "coverPhoto",
                "createdAt",
                "updatedAt"
            FROM
                "Users"
            WHERE
                username ILIKE :searchTerm
                OR email ILIKE :searchTerm
                OR firstname ILIKE :searchTerm
                OR lastname ILIKE :searchTerm
            LIMIT :limit
            OFFSET :skip
        `, {
            replacements: { searchTerm: `%${searchTerm}%`, limit, skip },
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
        const setFields: string[] = [];
        const replacements: any = { userId };

        if (updates.firstname !== undefined) {
            setFields.push('firstname = :firstname');
            replacements.firstname = updates.firstname;
        }
        if (updates.lastname !== undefined) {
            setFields.push('lastname = :lastname');
            replacements.lastname = updates.lastname;
        }
        if (updates.info !== undefined) {
            setFields.push('info = :info');
            replacements.info = JSON.stringify(updates.info);
        }
        if (updates.profilePicture !== undefined) {
            setFields.push('"profilePicture" = :profilePicture');
            replacements.profilePicture = JSON.stringify(updates.profilePicture);
        }
        if (updates.coverPhoto !== undefined) {
            setFields.push('"coverPhoto" = :coverPhoto');
            replacements.coverPhoto = JSON.stringify(updates.coverPhoto);
        }

        if (setFields.length === 0) {
            const user = await getUserById(userId);
            return user;
        }

        const user = await sequelize.query(`
            UPDATE "Users"
            SET
                ${setFields.join(', ')},
                "updatedAt" = NOW()
            WHERE
                id = :userId
            RETURNING *
        `, {
            replacements,
            type: QueryTypes.UPDATE
        });

        return (user as any)[0][0];
    } catch (error) {
        console.error("Error updating user:", error);
        throw error;
    }
}
