import { createComment as createCommentSql, getCommentsByPostId as getCommentsByPostIdSql } from './comment.sql.service';

export const createComment = async (authorId: string, postId: string, content: string) => {
    try {
        return await createCommentSql(authorId, postId, content);
    } catch (error) {
        throw error;
    }
}

export const getCommentsByPostId = async (postId: string, skip: number, limit: number) => {
    try {
        return await getCommentsByPostIdSql(postId, skip, limit);
    } catch (error) {
        throw error;
    }
}