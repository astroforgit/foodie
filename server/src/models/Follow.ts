
import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import User from './User';

export class Follow extends Model {}

Follow.init({
    follower: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    following: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Follow'
});
