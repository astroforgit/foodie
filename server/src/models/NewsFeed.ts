import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import User from './User';
import Post from './Post';

class NewsFeed extends Model {}

NewsFeed.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    follower: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    post: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Post,
            key: 'id'
        }
    },
    post_owner: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'NewsFeed'
});

export default NewsFeed;
