import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";

export const createComment = async (authorId: string, postId: string, body: string) => {
    try {
        const result = await sequelize.query(`
            INSERT INTO "Comments" ("_author_id", "_post_id", body, depth, "createdAt", "updatedAt")
            VALUES (:authorId, :postId, :body, 1, NOW(), NOW())
            RETURNING *
        `, {
            replacements: { authorId: parseInt(authorId), postId: parseInt(postId), body },
            type: QueryTypes.INSERT
        });

        return result[0];
    } catch (error) {
        console.error("Error creating comment:", error);
        throw error;
    }
}

export const getCommentsByPostId = async (postId: string, skip: number, limit: number) => {
    try {
        const comments = await sequelize.query(`
            SELECT
                c.id,
                c.body,
                c."isEdited",
                c."createdAt",
                c."updatedAt",
                c.depth,
                c.parent,
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'firstname', u.firstname,
                    'lastname', u.lastname
                ) as author
            FROM
                "Comments" c
            JOIN
                "Users" u ON c."_author_id" = u.id
            WHERE
                c."_post_id" = :postId AND c.parent IS NULL
            ORDER BY
                c."createdAt" DESC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { postId: parseInt(postId), skip, limit },
            type: QueryTypes.SELECT
        });

        return comments;
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
}

export const getCommentById = async (commentId: string) => {
    try {
        const result = await sequelize.query(`
            SELECT
                c.id,
                c.body,
                c."isEdited",
                c."createdAt",
                c."updatedAt",
                c.depth,
                c.parent,
                c."_post_id",
                c."_author_id",
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'firstname', u.firstname,
                    'lastname', u.lastname
                ) as author
            FROM
                "Comments" c
            JOIN
                "Users" u ON c."_author_id" = u.id
            WHERE
                c.id = :commentId
        `, {
            replacements: { commentId: parseInt(commentId) },
            type: QueryTypes.SELECT
        });

        return result[0];
    } catch (error) {
        console.error("Error fetching comment by ID:", error);
        throw error;
    }
}

export const updateComment = async (commentId: string, body: string) => {
    try {
        const result = await sequelize.query(`
            UPDATE "Comments"
            SET body = :body, "isEdited" = true, "updatedAt" = NOW()
            WHERE id = :commentId
            RETURNING *
        `, {
            replacements: { commentId, body },
            type: QueryTypes.UPDATE
        });

        return result[0];
    } catch (error) {
        console.error("Error updating comment:", error);
        throw error;
    }
}

export const createReply = async (authorId: string, postId: string, parentId: string, body: string, depth: number) => {
    try {
        const result = await sequelize.query(`
            INSERT INTO "Comments" ("_author_id", "_post_id", parent, body, depth, "createdAt", "updatedAt")
            VALUES (:authorId, :postId, :parentId, :body, :depth, NOW(), NOW())
            RETURNING *
        `, {
            replacements: { authorId, postId, parentId, body, depth },
            type: QueryTypes.INSERT
        });

        return result[0];
    } catch (error) {
        console.error("Error creating reply:", error);
        throw error;
    }
}

export const getRepliesByCommentId = async (commentId: string, skip: number, limit: number) => {
    try {
        const replies = await sequelize.query(`
            SELECT
                c.id,
                c.body,
                c."isEdited",
                c."createdAt",
                c."updatedAt",
                c.depth,
                c.parent,
                json_build_object(
                    'id', u.id,
                    'email', u.email,
                    'username', u.username,
                    'firstname', u.firstname,
                    'lastname', u.lastname
                ) as author
            FROM
                "Comments" c
            JOIN
                "Users" u ON c."_author_id" = u.id
            WHERE
                c.parent = :commentId
            ORDER BY
                c."createdAt" ASC
            OFFSET :skip
            LIMIT :limit
        `, {
            replacements: { commentId, skip, limit },
            type: QueryTypes.SELECT
        });

        return replies;
    } catch (error) {
        console.error("Error fetching replies:", error);
        throw error;
    }
}