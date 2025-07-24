import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";
import { IUser } from "@/schemas/UserSchema";

export const getNewsFeed = async (user: IUser | null, query: any, skip: number, limit: number): Promise<any[]> => {
    if (!user) return [];

    try {
        // Handle both MongoDB (_id) and PostgreSQL (id) user IDs
        const userId = user['_id'] || user['id'];

        const followingResult = await sequelize.query(`
            SELECT following FROM "Follows" WHERE follower = :userId
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });
        const followingIds = (followingResult as { following: string }[]).map((row: { following: string; }) => row.following);

        if (followingIds.length === 0) {
            return [];
        }

        // Build the query with direct array interpolation to avoid parameter issues
        const followingIdsStr = followingIds.map(id => `'${id}'`).join(',');

        const posts = await sequelize.query(`
            SELECT
                p.id,
                p.privacy,
                p.description,
                p."isEdited",
                p."createdAt",
                p."updatedAt",
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'firstname', u.firstname,
                    'lastname', u.lastname
                ) as author
            FROM
                "Posts" p
            JOIN
                "Users" u ON p."_author_id" = u.id
            WHERE
                p."_author_id" IN (${followingIdsStr}) AND p.privacy = 'public'
            ORDER BY
                p."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { skip: skip, limit: limit },
            type: QueryTypes.SELECT
        });

        return posts as any[];
    } catch (error) {
        console.error("Error fetching news feed:", error);
        throw error;
    }
};