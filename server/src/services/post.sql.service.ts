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
        // Map MongoDB field names to PostgreSQL column names
        const columnMap: { [key: string]: string } = {
            'createdAt': 'p."createdAt"',
            'updatedAt': 'p."updatedAt"',
            '_id': 'p.id'
        };
        const pgColumn = columnMap[sortKey] || `p."${sortKey}"`;
        orderBy = `ORDER BY ${pgColumn} ${sortOrder}`;
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
        console.log('📄 POST SQL DEBUG - getPosts called');
        console.log('👤 POST SQL DEBUG - user:', user ? `ID: ${user['_id'] || user['id']}` : 'null');
        console.log('🔍 POST SQL DEBUG - query:', query);

        let whereClause = 'WHERE 1=1';
        const userId = user?.['_id'] || user?.['id'];
        const replacements: any = {};

        if (userId) {
            replacements.userId = userId;
            console.log('👤 POST SQL DEBUG - userId set:', userId);
        }

        if (query.author) {
            const authorIdInt = parseInt(query.author);
            whereClause += ' AND p."_author_id" = :authorId';
            replacements.authorId = authorIdInt;
            console.log('👤 POST SQL DEBUG - author filter:', query.author, '→', authorIdInt);
        }

        if (query._id) {
            const postIdInt = parseInt(query._id);
            whereClause += ' AND p.id = :postId';
            replacements.postId = postIdInt;
            console.log('🆔 POST SQL DEBUG - post ID filter:', query._id, '→', postIdInt);
        }

        if (query.privacy) {
            whereClause += ' AND p.privacy = :privacy';
            replacements.privacy = query.privacy;
            console.log('🔒 POST SQL DEBUG - privacy filter:', query.privacy);
        }

        if (query.privacyIn && Array.isArray(query.privacyIn)) {
            const placeholders = query.privacyIn.map((_, idx) => `:privacy${idx}`).join(', ');
            whereClause += ` AND p.privacy IN (${placeholders})`;
            query.privacyIn.forEach((priv, idx) => {
                replacements[`privacy${idx}`] = priv;
            });
            console.log('🔒 POST SQL DEBUG - privacy IN filter:', query.privacyIn);
        }

        if (query.descriptionSearch) {
            whereClause += ` AND p.description ILIKE :descSearch`;
            replacements.descSearch = `%${query.descriptionSearch}%`;
            console.log('🔍 POST SQL DEBUG - description search:', query.descriptionSearch);
        }

        if (query.isSaved && userId) {
            whereClause += ' AND EXISTS(SELECT 1 FROM "Bookmarks" b WHERE b.post_id = p.id AND b.user_id = :userId)';
            console.log('🔖 POST SQL DEBUG - saved posts filter added');
        }

        console.log('🔍 POST SQL DEBUG - Final WHERE clause:', whereClause);
        console.log('🔍 POST SQL DEBUG - Final replacements:', replacements);

        const posts = await sequelize.query(`
            SELECT
                p.id,
                p.privacy,
                p.photos,
                p.description,
                p."isEdited",
                p."createdAt",
                p."updatedAt",
                p."_author_id",
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

        console.log('📊 POST SQL DEBUG - Query executed, found', posts.length, 'posts');
        if (posts.length > 0) {
            console.log('📄 POST SQL DEBUG - First post:', { id: (posts[0] as any).id, description: (posts[0] as any).description?.substring(0, 50) });
        }

        return posts as any[];
    } catch (error) {
        console.error("❌ POST SQL DEBUG - Error fetching posts:", error);
        throw error;
    }
};

export const getPostById = async (postId: string, user: IUser | null): Promise<any> => {
    try {
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
                    'profilePicture', u."profilePicture",
                    'username', u.username
                ) as author,
                EXISTS(SELECT 1 FROM "Likes" l WHERE l.target = p.id AND l."user" = :userId AND l.type = 'Post') as "isLiked",
                (p."_author_id" = :userId) as "isOwnPost",
                EXISTS(SELECT 1 FROM "Bookmarks" b WHERE b.post_id = p.id AND b.user_id = :userId) as "isBookmarked",
                COALESCE((SELECT COUNT(*) FROM "Comments" c WHERE c."_post_id" = p.id), 0) as "commentsCount",
                COALESCE((SELECT COUNT(*) FROM "Likes" l WHERE l.target = p.id AND l.type = 'Post'), 0) as "likesCount"
            FROM
                "Posts" p
            JOIN
                "Users" u ON p."_author_id" = u.id
            WHERE
                p.id = :postId
        `, {
            replacements: { postId: parseInt(postId), userId: user ? (user['_id'] || user['id']) : null },
            type: QueryTypes.SELECT
        });

        return posts[0];
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
            replacements: { authorId: parseInt(authorId), description, photos: JSON.stringify(photos), privacy },
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
        const setFields: string[] = ['"isEdited" = true', '"updatedAt" = NOW()'];
        const replacements: any = { postId: parseInt(postId) };

        if (description !== undefined) {
            setFields.push('description = :description');
            replacements.description = description;
        }
        if (privacy !== undefined) {
            setFields.push('privacy = :privacy');
            replacements.privacy = privacy;
        }

        const result = await sequelize.query(`
            UPDATE "Posts"
            SET ${setFields.join(', ')}
            WHERE id = :postId
            RETURNING *
        `, {
            replacements,
            type: QueryTypes.UPDATE
        });

        return (result as any)[0][0];
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
}

export const deletePost = async (postId: string): Promise<any> => {
    try {
        await sequelize.query(`
            DELETE FROM "Posts" WHERE id = :postId
        `, {
            replacements: { postId: parseInt(postId) },
            type: QueryTypes.DELETE
        });
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}
