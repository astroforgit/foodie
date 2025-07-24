import { FEED_LIMIT } from '@/constants/constants';
import { makeResponseJson } from '@/helpers/utils';
import { ErrorHandler } from '@/middlewares';
import { EPrivacy } from '@/schemas/PostSchema';
import services from '@/services';
import config from '@/config/config';
import { NextFunction, Request, Response, Router } from 'express';

const router = Router({ mergeParams: true });

router.get(
    '/v1/feed',
    async (req: Request, res: Response, next: NextFunction) => {

        try {
            const offset = parseInt((req.query.offset as string), 10) || 0;
            const limit = FEED_LIMIT;
            const skip = offset * limit;

            console.log('🍽️ FEED DEBUG - Starting feed request');
            console.log('📊 FEED DEBUG - offset:', offset, 'limit:', limit, 'skip:', skip);
            console.log('🔐 FEED DEBUG - isAuthenticated:', req.isAuthenticated());
            console.log('🗄️ FEED DEBUG - database type:', config.db.type);

            let result = [];

            if (req.isAuthenticated()) {
                const userId = config.db.type === 'postgres' ? req.user['id'] : req.user['_id'];
                console.log('👤 FEED DEBUG - authenticated user ID:', userId);

                console.log('📰 FEED DEBUG - Getting newsfeed for authenticated user');
                result = await services.newsfeed.getNewsFeed(
                    req.user,
                    { follower: userId },
                    skip,
                    limit
                );
                console.log('📊 FEED DEBUG - Newsfeed result count:', result.length);
            } else {
                console.log('🌍 FEED DEBUG - Getting public posts for unauthenticated user');
                result = await services.post.getPosts(null, { privacy: EPrivacy.public }, { skip, limit, sort: { createdAt: -1 } });
                console.log('📊 FEED DEBUG - Public posts result count:', result.length);
            }

            if (result.length === 0) {
                console.log('❌ FEED DEBUG - No posts found, returning 404');
                return next(new ErrorHandler(404, 'No more feed.'));
            }

            console.log('✅ FEED DEBUG - Sending', result.length, 'posts');
            res.status(200).send(makeResponseJson(result));
        } catch (e) {
            console.log('CANT GET FEED', e);
            next(e);
        }
    }
);

export default router;
