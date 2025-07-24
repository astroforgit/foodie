import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";
import { IUser } from "@/schemas/UserSchema";

export const getNewsFeed = async (user: IUser | null, query: any, skip: number, limit: number): Promise<any[]> => {
    if (!user) return [];

    try {
        const [followingResult] = await sequelize.query(`
            SELECT target_id FROM follows WHERE user_id = :userId
        `, {
            replacements: { userId: user._id },
            type: QueryTypes.SELECT
        });
        const followingIds = (followingResult as { target_id: string }[]).map((row: { target_id: string; }) => row.target_id);

        if (followingIds.length === 0) {
            return [];
        }

        const [posts] = await sequelize.query(`
            SELECT
                p.id,
                p.privacy,
                p.photos,
                p.description,
                p.is_edited as "isEdited",
                p.created_at as "createdAt",
                p.updated_at as "updatedAt",
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'profilePicture', u.profile_picture,
                    'username', u.username
                ) as author,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as "likesCount",
                (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as "commentsCount",
                EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = :userId) as "isLiked"
            FROM
                posts p
            JOIN
                users u ON p.author_id = u.id
            WHERE
                p.author_id = ANY(:followingIds::uuid[]) AND (p.privacy = 'public' OR p.author_id = :userId)
            ORDER BY
                p.created_at DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { followingIds: followingIds, skip: skip, limit: limit, userId: user._id },
            type: QueryTypes.SELECT
        });

        return posts as any[];
    } catch (error) {
        console.error("Error fetching news feed:", error);
        throw error;
    }
};