import { Follow } from "@/schemas";
import { IUser } from "@/schemas/UserSchema";
import { Types } from 'mongoose';

export const getFollow = (
    query: Object,
    type = 'followers',
    user: IUser,
    skip?: number,
    limit?: number
): Promise<IUser[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const myFollowingDoc = await Follow.find({ user: user._id });
            const myFollowing = myFollowingDoc.map(user => user.target); // map to array of user IDs

            const agg = await Follow.aggregate([
                {
                    $match: query
                },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: type === 'following' ? 'target' : 'user',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                {
                    $unwind: '$user'
                },
                {
                    $addFields: {
                        isFollowing: { $in: ['$user._id', myFollowing] }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        id: '$user._id',
                        username: '$user.username',
                        email: '$user.email',
                        profilePicture: '$user.profilePicture',
                        isFollowing: 1
                    }
                }
            ]);

            resolve(agg);
        } catch (err) {
            reject(err);
        }
    });
}

export const getFollowing = async (
    query: any,
    user: IUser,
    skip?: number,
    limit?: number
): Promise<IUser[]> => {
    return getFollow(query, 'following', user, skip, limit);
}

export const checkFollow = async (userId: string, targetId: string): Promise<boolean> => {
    try {
        const follow = await Follow.findOne({
            user: Types.ObjectId(userId),
            target: Types.ObjectId(targetId)
        });
        return !!follow;
    } catch (error) {
        console.error("Error checking follow:", error);
        throw error;
    }
}

export const createFollow = async (userId: string, targetId: string) => {
    try {
        const newFollow = new Follow({
            user: Types.ObjectId(userId),
            target: Types.ObjectId(targetId)
        });
        await newFollow.save();
    } catch (error) {
        console.error("Error creating follow:", error);
        throw error;
    }
}

export const deleteFollow = async (userId: string, targetId: string) => {
    try {
        await Follow.deleteOne({
            user: Types.ObjectId(userId),
            target: Types.ObjectId(targetId)
        });
    } catch (error) {
        console.error("Error deleting follow:", error);
        throw error;
    }
}

export const getSuggestedPeople = async (userId: string, skip: number, limit: number): Promise<any[]> => {
    try {
        const { User } = require('@/schemas');

        const myFollowingDoc = await Follow.find({ user: Types.ObjectId(userId) });
        const myFollowing = myFollowingDoc.map(follow => follow.target);

        const people = await User.aggregate([
            {
                $match: {
                    _id: {
                        $nin: [...myFollowing, Types.ObjectId(userId)]
                    }
                }
            },
            ...(limit < 10 ? ([{ $sample: { size: limit } }]) : []),
            { $skip: skip },
            { $limit: limit },
            {
                $addFields: {
                    isFollowing: false
                }
            },
            {
                $project: {
                    _id: 0,
                    id: '$_id',
                    username: '$username',
                    profilePicture: '$profilePicture',
                    isFollowing: 1
                }
            }
        ]);

        return people;
    } catch (error) {
        console.error("Error fetching suggested people:", error);
        throw error;
    }
}