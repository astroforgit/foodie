import sequelize from "@/db/sql/sequelize";
import { QueryTypes } from "sequelize";
import { IUser } from "@/schemas/UserSchema";

interface IPaginate {
    sort: {
        [prop: string]: any
    };
    skip: number;
    limit: number;
}

const buildPaginateOptions = (opts: Partial<IPaginate>) => {
    let orderBy = '';
    if (opts.sort) {
        const sortKey = Object.keys(opts.sort)[0];
        const sortOrder = opts.sort[sortKey] === 1 ? 'ASC' : 'DESC';
        orderBy = `ORDER BY ${sortKey} ${sortOrder}`;
    }

    let pagination = '';
    if (opts.limit) {
        pagination += `LIMIT ${opts.limit}`;
    }
    if (opts.skip) {
        pagination += ` OFFSET ${opts.skip}`;
    }

    return `${orderBy} ${pagination}`;
}

export const getPosts = async (user: IUser | null, query: any, paginate?: Partial<IPaginate>): Promise<any[]> => {
    try {
        let whereClause = 'WHERE 1=1';
        const userId = user?.['_id'] || user?.['id'];
        const replacements: any = {};

        if (userId) {
            replacements.userId = userId;
        }

        if (query.author) {
            whereClause += ' AND p."_author_id" = :authorId';
            replacements.authorId = query.author;
        }

        if (query._id) {
            whereClause += ' AND p.id = :postId';
            replacements.postId = parseInt(query._id);
        }

        if (query.isSaved && userId) {
            whereClause += ' AND EXISTS(SELECT 1 FROM "Bookmarks" b WHERE b.post_id = p.id AND b.user_id = :userId)';
        }

        const posts = await sequelize.query(`
            SELECT
                p.id,
                p.privacy,
                p.photos,
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
                ) as author,
                ${userId ? `EXISTS(SELECT 1 FROM "Likes" l WHERE l.target = p.id AND l."user" = :userId AND l.type = 'Post')` : 'false'} as "isLiked",
                ${userId ? `(p."_author_id" = :userId)` : 'false'} as "isOwnPost",
                ${userId ? `EXISTS(SELECT 1 FROM "Bookmarks" b WHERE b.post_id = p.id AND b.user_id = :userId)` : 'false'} as "isBookmarked",
                COALESCE((SELECT COUNT(*) FROM "Comments" c WHERE c."_post_id" = p.id), 0) as "commentsCount",
                COALESCE((SELECT COUNT(*) FROM "Likes" l WHERE l.target = p.id AND l.type = 'Post'), 0) as "likesCount"
            FROM
                "Posts" p
            JOIN
                "Users" u ON p."_author_id" = u.id
            ${whereClause}
            ${buildPaginateOptions(paginate || {})}
        `, {
            replacements,
            type: QueryTypes.SELECT
        });

        return posts as any[];
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

export const getPostById = async (postId: string, user: IUser | null): Promise<any> => {
    try {
        const [post] = await sequelize.query(`
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
                EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = :userId) as "isLiked",
                (p.author_id = :userId) as "isOwnPost",
                EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = :userId) as "isBookmarked",
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as "commentsCount",
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as "likesCount"
            FROM
                posts p
            JOIN
                users u ON p.author_id = u.id
            WHERE
                p.id = :postId
        `, {
            replacements: { postId, userId: user?._id },
            type: QueryTypes.SELECT
        });

        return (post as any[])[0];
    } catch (error) {
        console.error("Error fetching post by id:", error);
        throw error;
    }
}

export const createPost = async (authorId: string, data: any): Promise<any> => {
    try {
        const { description, photos, privacy } = data;
        const [post] = await sequelize.query(`
            INSERT INTO "Posts" ("_author_id", description, photos, privacy, "createdAt", "updatedAt")
            VALUES (:authorId, :description, :photos, :privacy, NOW(), NOW())
            RETURNING *
        `, {
            replacements: { authorId, description, photos: JSON.stringify(photos), privacy },
            type: QueryTypes.INSERT
        });

        return (post as any)[0];
    } catch (error) {
        console.error("Error creating post:", error);
        throw error;
    }
};

export const updatePost = async (postId: string, data: any): Promise<any> => {
    try {
        const { description, privacy } = data;
        const [post] = await sequelize.query(`
            UPDATE posts
            SET
                description = :description,
                privacy = :privacy,
                is_edited = TRUE,
                updated_at = NOW()
            WHERE
                id = :postId
            RETURNING *
        `, {
            replacements: { postId, description, privacy },
            type: QueryTypes.UPDATE
        });

        return (post as any)[0];
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

export const deletePost = async (postId: string): Promise<any> => {
    try {
        await sequelize.query(`
            DELETE FROM posts WHERE id = :postId
        `, {
            replacements: { postId },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}
