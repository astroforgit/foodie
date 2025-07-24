import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const createComment = async (authorId: string, postId: string, content: string) => {
    try {
        const [comment] = await sequelize.query(`
            INSERT INTO comments (author_id, post_id, content)
            VALUES (:authorId, :postId, :content)
            RETURNING *
        `, {
            replacements: { authorId, postId, content },
            type: QueryTypes.INSERT
        });

        return comment[0];
    } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
    }
}

export const getCommentsByPostId = async (postId: string, skip: number, limit: number) => {
    try {
        const [comments] = await sequelize.query(`
            SELECT
                c.id,
                c.content,
                c.is_edited as "isEdited",
                c.created_at as "createdAt",
                c.updated_at as "updatedAt",
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'profilePicture', u.profile_picture,
                    'username', u.username
                ) as author
            FROM
                comments c
            JOIN
                users u ON c.author_id = u.id
            WHERE
                c.post_id = :postId
            ORDER BY
                c.created_at DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { postId, skip, limit },
            type: QueryTypes.SELECT
        });

        return comments;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
}