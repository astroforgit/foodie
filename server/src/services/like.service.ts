import { createLike as createLikeSql, deleteLike as deleteLikeSql } from './like.sql.service';

export const createLike = async (userId: string, postId: string) => {
    try {
        await createLikeSql(userId, postId);
    } catch (error) {
        throw error;
    }
}

export const deleteLike = async (userId: string, postId: string) => {
    try {
        await deleteLikeSql(userId, postId);
    } catch (error) {
        throw error;
    }
}