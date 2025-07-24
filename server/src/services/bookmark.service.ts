import { createBookmark as createBookmarkSql, deleteBookmark as deleteBookmarkSql } from './bookmark.sql.service';

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