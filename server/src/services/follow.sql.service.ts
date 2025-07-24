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
        const userId = user._id || user.id;
        const myFollowingResult: any[] = await sequelize.query(`
            SELECT following FROM "Follows" WHERE follower = :userId
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });
        const myFollowing = myFollowingResult.map((row: { following: string; }) => row.following);

        let whereClause = 'WHERE TRUE';
        const queryParams: any = { myFollowing };

        if (query.user) {
            whereClause += ` AND f.follower = :queryUserId`;
            queryParams.queryUserId = query.user;
        }
        if (query.target) {
            whereClause += ` AND f.following = :queryTargetId`;
            queryParams.queryTargetId = query.target;
        }

        let joinTable = 'f.follower';
        if (type === 'following') {
            joinTable = 'f.following';
        }

        let pagination = '';
        if (limit) {
            pagination += ` LIMIT ${limit}`;
        }
        if (skip) {
            pagination += ` OFFSET ${skip}`;
        }

        // Handle empty myFollowing array
        const followingCheck = myFollowing.length > 0
            ? `CASE WHEN u.id = ANY(ARRAY[${myFollowing.join(',')}]::integer[]) THEN TRUE ELSE FALSE END`
            : 'FALSE';

        const results = await sequelize.query(`
            SELECT
                u.id,
                u.username,
                u.email,
                u.firstname,
                u.lastname,
                ${followingCheck} as "isFollowing"
            FROM
                "Follows" f
            JOIN
                "Users" u ON u.id = ${joinTable}
            ${whereClause}
            ${pagination}
        `, {
            replacements: queryParams,
            type: QueryTypes.SELECT
        });

        return results as IUser[];
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

export const checkFollow = async (userId: string, targetId: string): Promise<boolean> => {
    try {
        const result = await sequelize.query(`
            SELECT 1 FROM "Follows" WHERE follower = :userId AND following = :targetId
        `, {
            replacements: { userId, targetId },
            type: QueryTypes.SELECT
        });
        return result.length > 0;
    } catch (error) {
        console.error("Error checking follow:", error);
        throw error;
    }
}

export const createFollow = async (userId: string, targetId: string) => {
    try {
        await sequelize.query(`
            INSERT INTO "Follows" (follower, following) VALUES (:userId, :targetId)
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
            DELETE FROM "Follows" WHERE follower = :userId AND following = :targetId
        `, {
            replacements: { userId, targetId },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting follow:", error);
        throw error;
    }
}

export const getSuggestedPeople = async (userId: string, skip: number, limit: number): Promise<any[]> => {
    try {
        // Get users that the current user is following
        const myFollowingResult = await sequelize.query(`
            SELECT following FROM "Follows" WHERE follower = :userId
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });
        const myFollowing = myFollowingResult.map((row: { following: string; }) => row.following);

        // Build exclusion list (people I follow + myself)
        const excludeIds = [...myFollowing, userId];
        const excludeIdsStr = excludeIds.map(id => `'${id}'`).join(',');

        const results = await sequelize.query(`
            SELECT
                u.id,
                u.username,
                u.firstname,
                u.lastname,
                false as "isFollowing"
            FROM "Users" u
            WHERE u.id NOT IN (${excludeIdsStr})
            ORDER BY RANDOM()
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { skip, limit },
            type: QueryTypes.SELECT
        });

        return results;
    } catch (error) {
        console.error("Error fetching suggested people:", error);
        throw error;
    }
}