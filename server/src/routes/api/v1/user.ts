import { makeResponseJson } from '@/helpers/utils';
import { ErrorHandler, isAuthenticated } from '@/middlewares';
import { Follow, User } from '@/schemas';
import { EGender, IUser } from '@/schemas/UserSchema';
import { multer, uploadImageToStorage } from '@/storage/cloudinary';
import { schemas, validateBody } from '@/validations/validations';
import { NextFunction, Request, Response, Router } from 'express';
import config from '@/config/config';
import services from '@/services';

const router = Router({ mergeParams: true });

router.get(
    '/v1/:username',
    isAuthenticated,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;

            let user;
            if (config.db.type === 'postgres') {
                user = await services.user.getUserByUsername(username);
            } else {
                user = await User.findOne({ username });
            }

            if (!user) return next(new ErrorHandler(404, 'User not found.'));

            let myFollowing = [];
            if (config.db.type === 'postgres') {
                myFollowing = await services.follow.getFollowingIds(req.user['id']);
            } else {
                const myFollowingDoc = await Follow.find({ user: req.user._id });
                myFollowing = myFollowingDoc.map(user => user.target);
            }

            let result;
            if (config.db.type === 'postgres') {
                const userId = user.id;
                const { followersCount, followingCount } = await services.follow.getFollowCounts(userId);
                const isFollowing = myFollowing.includes(userId);

                result = {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    dateJoined: user.createdAt,
                    followingCount,
                    followersCount,
                    isFollowing,
                    isOwnProfile: user.username === req.user.username,
                    info: user.info || { bio: '', birthday: '', gender: 'unspecified' },
                    isEmailValidated: false,
                    profilePicture: user.profilePicture || {},
                    coverPhoto: user.coverPhoto || {}
                };
            } else {
                const agg = await User.aggregate([
                    {
                        $match: { _id: user._id }
                    },
                    {
                        $lookup: { // lookup for followers
                            from: 'follows',
                            localField: '_id',
                            foreignField: 'target',
                            as: 'followers'
                        }
                    },
                    {
                        $lookup: { // lookup for following
                            from: 'follows',
                            localField: '_id',
                            foreignField: 'user',
                            as: 'following'
                        }
                    },
                    {
                        $addFields: {
                            isFollowing: { $in: ['$_id', myFollowing] },
                            isOwnProfile: {
                                $eq: ['$$CURRENT.username', req.user.username]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            id: '$_id',
                            info: 1,
                            isEmailValidated: 1,
                            email: 1,
                            profilePicture: 1,
                            coverPhoto: 1,
                            username: 1,
                            firstname: 1,
                            lastname: 1,
                            dateJoined: 1,
                            followingCount: { $size: '$following' },
                            followersCount: { $size: '$followers' },
                            isFollowing: 1,
                            isOwnProfile: 1
                        }
                    },
                ]);

                if (agg.length === 0) return next(new ErrorHandler(404, 'User not found.'));
                result = { ...agg[0], fullname: user.fullname };
            }

            res.status(200).send(makeResponseJson(result));
        } catch (e) {
            console.log(e)
            next(e);
        }
    }
)

interface IUpdate {
    firstname?: string;
    lastname?: string;
    info?: {
        bio?: string;
        birthday?: string | number;
        gender?: EGender;
    }
}

router.patch(
    '/v1/:username/edit',
    isAuthenticated,
    validateBody(schemas.editProfileSchema),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { username } = req.params;
            const { firstname, lastname, bio, birthday, gender } = req.body;

            if (username !== (req.user as IUser).username) return next(new ErrorHandler(401));

            if (config.db.type === 'postgres') {
                const user = await services.user.getUserByUsername(username);
                if (!user) return next(new ErrorHandler(404, 'User not found.'));

                const update: any = {};
                if (typeof firstname !== 'undefined') update.firstname = firstname;
                if (typeof lastname !== 'undefined') update.lastname = lastname;
                if (bio || birthday || gender) {
                    const currentInfo = user.info || {};
                    update.info = {
                        ...currentInfo,
                        ...(bio !== undefined && { bio }),
                        ...(birthday !== undefined && { birthday }),
                        ...(gender !== undefined && { gender })
                    };
                }

                const newUser = await services.user.updateUser(user.id, update);
                res.status(200).send(makeResponseJson(newUser));
            } else {
                const update: IUpdate = { info: {} };
                if (typeof firstname !== 'undefined') update.firstname = firstname;
                if (typeof lastname !== 'undefined') update.lastname = lastname;
                if (bio) update.info.bio = bio;
                if (birthday) update.info.birthday = birthday;
                if (gender) update.info.gender = gender;

                const newUser = await User
                    .findOneAndUpdate({ username }, {
                        $set: update
                    }, {
                        new: true
                    });

                res.status(200).send(makeResponseJson(newUser.toUserJSON()));
            }
        } catch (e) {
            console.log(e);
            next(e);
        }
    }
)

router.post(
    '/v1/upload/:field',
    isAuthenticated,
    multer.single('photo'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { field } = req.params;
            const file = req.file;

            if (!file) return next(new ErrorHandler(400, 'File not provided.'));
            if (!['picture', 'cover'].includes(field)) return next(new ErrorHandler(400, `Unexpected field ${field}`));

            const image = await uploadImageToStorage(file, `${req.user.username}/profile`);
            const fieldToUpdate = field === 'picture' ? 'profilePicture' : 'coverPhoto';

            if (config.db.type === 'postgres') {
                const userId = req.user['id'];
                await services.user.updateUser(userId, { [fieldToUpdate]: image });
            } else {
                await User.findByIdAndUpdate((req.user as IUser)._id, {
                    $set: {
                        [fieldToUpdate]: image
                    }
                });
            }

            res.status(200).send(makeResponseJson({ image }));
        } catch (e) {
            console.log('CANT UPLOAD FILE: ', e);
            next(e);
        }
    }
);

export default router;
