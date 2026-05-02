import {
    createBookmark as createBookmarkSql,
    deleteBookmark as deleteBookmarkSql,
    getBookmarks as getBookmarksSql,
    checkBookmark as checkBookmarkSql
} from './bookmark.sql.service';

export const createBookmark = async (userId: string, postId: string) => {
    try {
        await createBookmarkSql(userId, postId);
    } catch (error) {
        throw error;
    }
}

export const deleteBookmark = async (userId: string, postId: string) => {
    try {
        await deleteBookmarkSql(userId, postId);
    } catch (error) {
        throw error;
    }
}

export const getBookmarks = async (userId: string, skip: number, limit: number) => {
    return getBookmarksSql(userId, skip, limit);
}

export const checkBookmark = async (userId: string, postId: string) => {
    return checkBookmarkSql(userId, postId);
}