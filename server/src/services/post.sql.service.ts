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
        const replacements: any = { userId: user?._id };

        if (query.author) {
            whereClause += ' AND p.author_id = :authorId';
            replacements.authorId = query.author;
        }
        
        if (query.isSaved) {
            whereClause += ' AND EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = :userId)';
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
                EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = :userId) as "isLiked",
                (p.author_id = :userId) as "isOwnPost",
                EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = :userId) as "isBookmarked",
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as "commentsCount",
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as "likesCount"
            FROM
                posts p
            JOIN
                users u ON p.author_id = u.id
            ${whereClause}
            ${buildPaginateOptions(paginate || {})}
        `, {
            replacements,
            type: QueryTypes.SELECT
        });

        return posts;
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

        return post[0];
    } catch (error) {
        console.error("Error fetching post by id:", error);
        throw error;
    }
}

export const createPost = async (authorId: string, data: any): Promise<any> => {
    try {
        const { description, photos, privacy } = data;
        const [post] = await sequelize.query(`
            INSERT INTO posts (author_id, description, photos, privacy)
            VALUES (:authorId, :description, :photos, :privacy)
            RETURNING *
        `, {
            replacements: { authorId, description, photos, privacy },
            type: QueryTypes.INSERT
        });

        return post[0];
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

        return post[0];
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
