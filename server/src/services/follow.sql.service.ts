import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";
import { IUser } from "@/schemas/UserSchema";

export const getFollow = async (
    query: any,
    type = 'followers',
    user: IUser,
    skip?: number,
    limit?: number
): Promise<IUser[]> => {
    try {
        const myFollowingResult: any[] = await sequelize.query(`
            SELECT target_id FROM follows WHERE user_id = :userId
        `, {
            replacements: { userId: user._id },
            type: QueryTypes.SELECT
        });
        const myFollowing = myFollowingResult.map((row: { target_id: string; }) => row.target_id);

        let whereClause = 'WHERE TRUE';
        const queryParams = [user._id];
        let paramIndex = 2;

        if (query.user) {
            whereClause += ` AND f.user_id = $${paramIndex++}`;
            queryParams.push(query.user);
        }
        if (query.target) {
            whereClause += ` AND f.target_id = $${paramIndex++}`;
            queryParams.push(query.target);
        }

        let joinTable = 'f.user_id';
        if (type === 'following') {
            joinTable = 'f.target_id';
        }

        let pagination = '';
        if (limit) {
            pagination += ` LIMIT ${limit}`;
        }
        if (skip) {
            pagination += ` OFFSET ${skip}`;
        }

        const [agg] = await sequelize.query(`
            SELECT
                u.id,
                u.username,
                u.email,
                u.profile_picture as "profilePicture",
                CASE WHEN u.id = ANY(:myFollowing::uuid[]) THEN TRUE ELSE FALSE END as "isFollowing"
            FROM
                follows f
            JOIN
                users u ON u.id = ${joinTable}
            ${whereClause}
            ${pagination}
        `, {
            replacements: { myFollowing: myFollowing, ...queryParams },
            type: QueryTypes.SELECT
        });

        return agg as IUser[];
    } catch (error) {
        console.error("Error fetching follow data:", error);
        throw error;
    }
};

export const getFollowing = async (
    query: any,
    user: IUser,
    skip?: number,
    limit?: number
): Promise<IUser[]> => {
    return getFollow(query, 'following', user, skip, limit);
}

export const createFollow = async (userId: string, targetId: string) => {
    try {
        await sequelize.query(`
            INSERT INTO follows (user_id, target_id) VALUES (:userId, :targetId)
        `, {
            replacements: { userId, targetId },
            type: QueryTypes.INSERT
        });
    } catch (error) {
        console.error("Error creating follow:", error);
        throw error;
    }
}

export const deleteFollow = async (userId: string, targetId: string) => {
    try {
        await sequelize.query(`
            DELETE FROM follows WHERE user_id = :userId AND target_id = :targetId
        `, {
            replacements: { userId, targetId },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting follow:", error);
        throw error;
    }
}