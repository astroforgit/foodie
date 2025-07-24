import { NOTIFICATIONS_LIMIT } from '@/constants/constants';
import { makeResponseJson } from '@/helpers/utils';
import { ErrorHandler, isAuthenticated } from '@/middlewares';
import { Notification } from '@/schemas';
import services from '@/services';
import config from '@/config/config';
import { NextFunction, Request, Response, Router } from 'express';

const router = Router({ mergeParams: true });

router.get(
    '/v1/notifications',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            let offset = parseInt(req.query.offset as string) || 0;

            const limit = NOTIFICATIONS_LIMIT;
            const skip = offset * limit;
            const userId = config.db.type === 'postgres' ? req.user['id'] : req.user['_id'];

            let notifications, unreadCount, count, result;

            if (config.db.type === 'postgres') {
                notifications = await services.notification.getNotifications(userId, skip, limit);
                unreadCount = await services.notification.getUnreadNotifications(userId);
                count = await services.notification.getTotalNotifications(userId);
                result = { notifications, unreadCount, count };
            } else {
                notifications = await Notification
                    .find({ target: req.user._id })
                    .populate('target initiator', 'profilePicture username fullname')
                    .sort({ createdAt: -1 })
                    .limit(limit)
                    .skip(skip);
                const unreadNotifications = await Notification.find({ target: req.user._id, unread: true });
                const totalNotifications = await Notification.find({ target: req.user._id });
                result = { notifications, unreadCount: unreadNotifications.length, count: totalNotifications.length };
            }

            if (notifications.length === 0 && offset === 0) {
                return next(new ErrorHandler(404, 'You have no notifications.'));
            } else if (notifications.length === 0 && offset >= 1) {
                return next(new ErrorHandler(404, 'No more notifications.'));
            }

            res.status(200).send(makeResponseJson(result));

            if (notifications.length === 0 && offset === 0) {
                return next(new ErrorHandler(404, 'You have no notifications.'));
            } else if (notifications.length === 0 && offset >= 1) {
                return next(new ErrorHandler(404, 'No more notifications.'));
            }

            res.status(200).send(makeResponseJson(result));
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
);

router.get(
    '/v1/notifications/unread',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = config.db.type === 'postgres' ? req.user['id'] : req.user['_id'];

            if (config.db.type === 'postgres') {
                const count = await services.notification.getUnreadNotifications(userId);
                res.status(200).send(makeResponseJson({ count }));
            } else {
                const notif = await Notification.find({ target: req.user._id, unread: true });
                res.status(200).send(makeResponseJson({ count: notif.length }));
            }
        } catch (e) {
            console.log('CANT GET UNREAD NOTIFICATIONS', e);
            next(e);
        }
    }
);

router.patch(
    '/v1/notifications/mark',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = config.db.type === 'postgres' ? req.user['id'] : req.user['_id'];

            if (config.db.type === 'postgres') {
                await services.notification.markAllAsRead(userId);
            } else {
                await Notification
                    .updateMany(
                        { target: req.user._id },
                        {
                            $set: {
                                unread: false
                            }
                        });
            }
            res.status(200).send(makeResponseJson({ state: false }));
        } catch (e) {
            console.log('CANT MARK ALL AS UNREAD', e);
            next(e);
        }
    }
);

router.patch(
    '/v1/read/notification/:id',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;

            if (config.db.type === 'postgres') {
                await services.notification.markAsRead(id);
            } else {
                const notif = await Notification.findById(id);
                if (!notif) return res.sendStatus(400);

                await Notification
                    .findByIdAndUpdate(id, {
                        $set: {
                            unread: false
                        }
                    });
            }

            res.status(200).send(makeResponseJson({ state: false })) // state = false EQ unread = false
        } catch (e) {
            next(e);
        }
    }
);

export default router;
