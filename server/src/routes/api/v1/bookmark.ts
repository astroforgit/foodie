import { BOOKMARKS_LIMIT } from '@/constants/constants';
import { makeResponseJson } from '@/helpers/utils';
import { ErrorHandler } from '@/middlewares/error.middleware';
import { isAuthenticated, validateObjectID } from '@/middlewares/middlewares';
import { Bookmark, Post } from '@/schemas';
import services from '@/services';
import config from '@/config/config';
import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';

const router = Router({ mergeParams: true });

router.post(
    '/v1/bookmark/post/:post_id',
    isAuthenticated,
    validateObjectID('post_id'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { post_id } = req.params;

            if (config.db.type === 'postgres') {
                const posts = await services.post.getPosts(req.user, { _id: post_id });
                const post = posts[0];
                if (!post) return res.sendStatus(404);

                const userID = req.user['id'];
                if (userID.toString() === post._author_id.toString()) {
                    return next(new ErrorHandler(400, 'You can\'t bookmark your own post.'));
                }

                const isPostBookmarked = await services.bookmark.checkBookmark(userID, post_id);
                if (isPostBookmarked) {
                    await services.bookmark.deleteBookmark(userID, post_id);
                    res.status(200).send(makeResponseJson({ state: false }));
                } else {
                    await services.bookmark.createBookmark(userID, post_id);
                    res.status(200).send(makeResponseJson({ state: true }));
                }
            } else {
                const userID = req.user._id;
                const post = await Post.findById(post_id);
                if (!post) return res.sendStatus(404);

                if (userID.toString() === post._author_id.toString()) {
                    return next(new ErrorHandler(400, 'You can\'t bookmark your own post.'));
                }

                const isPostBookmarked = await Bookmark
                    .findOne({
                        _author_id: userID,
                        _post_id: Types.ObjectId(post_id)
                    });

                if (isPostBookmarked) {
                    await Bookmark.findOneAndDelete({ _author_id: userID, _post_id: Types.ObjectId(post_id) });

                    res.status(200).send(makeResponseJson({ state: false }));
                } else {
                    const bookmark = new Bookmark({
                        _post_id: post_id,
                        _author_id: userID,
                        createdAt: Date.now()
                    });
                    await bookmark.save();

                    res.status(200).send(makeResponseJson({ state: true }));
                }
            }
        } catch (e) {
            console.log('CANT BOOKMARK POST ', e);
            next(e)
        }
    }
);

router.get(
    '/v1/bookmarks',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = parseInt((req.query.offset as string), 10) || 0;
            const limit = BOOKMARKS_LIMIT;
            const skip = offset * limit;

            if (config.db.type === 'postgres') {
                const userID = req.user['id'];
                const bookmarks = await services.bookmark.getBookmarks(userID, skip, limit);

                if (bookmarks.length === 0) {
                    return next(new ErrorHandler(404, "You don't have any bookmarks."))
                }

                res.status(200).send(makeResponseJson(bookmarks));
            } else {
                const userID = req.user._id;
                const bookmarks = await Bookmark
                    .find({ _author_id: userID })
                    .populate({
                        path: 'post',
                        select: 'photos description',
                        populate: {
                            path: 'likesCount commentsCount'
                        }
                    })
                    .limit(limit)
                    .skip(skip)
                    .sort({ createdAt: -1 });

                if (bookmarks.length === 0) {
                    return next(new ErrorHandler(404, "You don't have any bookmarks."))
                }

                const result = bookmarks.map((item) => {
                    return {
                        ...item.toObject(),
                        isBookmarked: true,
                    }
                });

                res.status(200).send(makeResponseJson(result));
            }
        } catch (e) {
            console.log('CANT GET BOOKMARKS ', e);
            next(e);
        }
    }
);

export default router;
