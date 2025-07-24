import { USERS_LIMIT } from '@/constants/constants';
import { makeResponseJson } from '@/helpers/utils';
import { ErrorHandler, isAuthenticated, validateObjectID } from '@/middlewares';
import { Follow, NewsFeed, Notification, Post, User } from '@/schemas';
import services from '@/services';
import config from '@/config/config';
import UserService from '@/services/user.service';
import { NextFunction, Request, Response, Router } from 'express';
import { Types } from 'mongoose';

const router = Router({ mergeParams: true });

router.post(
    '/v1/follow/:follow_id',
    isAuthenticated,
    validateObjectID('follow_id'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { follow_id } = req.params;

            const user = await UserService.getUserById(follow_id);
            // CHECK IF FOLLOWING USER EXIST
            if (!user) return next(new ErrorHandler(400, 'The person you\'re trying to follow doesn\'t exist.'));

            // CHECK IF FOLLOWING IS NOT YOURSELF
            const currentUserId = config.db.type === 'postgres' ? req.user.id : req.user._id.toString();
            if (follow_id === currentUserId) return next(new ErrorHandler(400, 'You can\'t follow yourself.'));

            //  CHECK IF ALREADY FOLLOWING
            if (config.db.type === 'postgres') {
                const isFollowing = await services.follow.checkFollow(currentUserId, follow_id);
                if (isFollowing) {
                    return next(new ErrorHandler(400, 'Already following.'));
                }
                await services.follow.createFollow(currentUserId, follow_id);
            } else {
                const isFollowing = await Follow.findOne({
                    user: req.user._id,
                    target: Types.ObjectId(follow_id)
                });

                if (isFollowing) {
                    return next(new ErrorHandler(400, 'Already following.'))
                } else {
                    const newFollower = new Follow({
                        user: req.user._id,
                        target: Types.ObjectId(follow_id)
                    });
                    await newFollower.save();
                }
            }

            // TODO ---- FILTER OUT DUPLICATES
            const io = req.app.get('io');
            const notification = new Notification({
                type: 'follow',
                initiator: req.user._id,
                target: Types.ObjectId(follow_id),
                link: `/user/${req.user.username}`,
                createdAt: Date.now()
            });

            notification
                .save()
                .then(async (doc) => {
                    await doc
                        .populate({
                            path: 'target initiator',
                            select: 'fullname profilePicture username'
                        }).execPopulate();

                    io.to(follow_id).emit('newNotification', { notification: doc, count: 1 });
                });

            // SUBSCRIBE TO USER'S FEED
            const subscribeToUserFeed = await Post
                .find({ _author_id: Types.ObjectId(follow_id) })
                .sort({ createdAt: -1 })
                .limit(10);

            if (subscribeToUserFeed.length !== 0) {
                const feeds = subscribeToUserFeed.map((post) => {
                    return {
                        follower: req.user._id,
                        post: post._id,
                        post_owner: post._author_id,
                        createdAt: post.createdAt
                    }
                });

                await NewsFeed.insertMany(feeds);
            }
            res.status(200).send(makeResponseJson({ state: true }));
        } catch (e) {
            console.log('CANT FOLLOW USER, ', e);
            next(e);
        }
    }
);

router.post(
    '/v1/unfollow/:follow_id',
    isAuthenticated,
    validateObjectID('follow_id'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { follow_id } = req.params;

            const user = await UserService.getUserById(follow_id);
            if (!user) return next(new ErrorHandler(400, 'The person you\'re trying to unfollow doesn\'t exist.'));

            const currentUserId = config.db.type === 'postgres' ? req.user.id : req.user._id.toString();
            if (follow_id === currentUserId) return next(new ErrorHandler(400));

            if (config.db.type === 'postgres') {
                await services.follow.deleteFollow(currentUserId, follow_id);
            } else {
                await Follow.deleteOne({
                    target: Types.ObjectId(follow_id),
                    user: req.user._id
                });
            }

            // UNSUBSCRIBE TO PERSON'S FEED
            await NewsFeed
                .deleteMany({
                    post_owner: Types.ObjectId(follow_id),
                    follower: req.user._id
                })

            res.status(200).send(makeResponseJson({ state: false }));
        } catch (e) {
            console.log('CANT FOLLOW USER, ', e);
            next(e);
        }
    }
);

router.get(
    '/v1/:username/following',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;
            const offset = parseInt(req.query.offset) || 0;
            const limit = USERS_LIMIT;
            const skip = offset * limit;

            const user = await UserService.getUserByUsername(username);
            if (!user) return next(new ErrorHandler(404, 'User not found.'))

            const userId = config.db.type === 'postgres' ? user['id'] : user['_id'];
            const following = await services.follow.getFollow(
                { user: userId },
                'following',
                req.user,
                skip,
                limit
            )

            if (following.length === 0) {
                return next(new ErrorHandler(404, `${username} isn't following anyone.`));
            }

            res.status(200).send(makeResponseJson(following));
        } catch (e) {
            next(e);
        }
    });

router.get(
    '/v1/:username/followers',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;
            const offset = parseInt(req.query.offset) || 0;
            const limit = USERS_LIMIT;
            const skip = offset * limit;

            const user = await UserService.getUserByUsername(username);
            if (!user) return next(new ErrorHandler(404, 'User not found.'))

            const userId = config.db.type === 'postgres' ? user['id'] : user['_id'];
            const followers = await services.follow.getFollow(
                { target: userId },
                'followers',
                req.user,
                skip,
                limit
            )

            if (followers.length === 0) {
                return next(new ErrorHandler(404, `${username} has no followers.`));
            }

            res.status(200).send(makeResponseJson(followers));
        } catch (e) {
            console.log('CANT GET FOLLOWERS', e);
            next(e);
        }
    });

router.get(
    '/v1/people/suggested',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const offset = parseInt(req.query.offset as string) || 0;
            const skipParam = parseInt(req.query.skip as string) || 0;

            const limit = parseInt(req.query.limit as string) || USERS_LIMIT;
            const skip = skipParam || offset * limit;
            const userId = config.db.type === 'postgres' ? req.user['id'] : req.user['_id'];

            const people = await services.follow.getSuggestedPeople(userId, skip, limit);

            if (people.length === 0) return next(new ErrorHandler(404, 'No suggested people.'));

            res.status(200).send(makeResponseJson(people));
        } catch (e) {
            console.log('CANT GET SUGGESTED PEOPLE', e);
            next(e);
        }
    }
)

export default router;
