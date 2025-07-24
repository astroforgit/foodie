import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import User from './User';
import Post from './Post';

class Bookmark extends Model {}

Bookmark.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    post_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Post,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Bookmark'
});

export default Bookmark;
