
import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import User from './User';

class Post extends Model {}

Post.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    _author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    description: {
        type: DataTypes.TEXT
    },
    photos: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    privacy: {
        type: DataTypes.STRING,
        defaultValue: 'public',
        validate: {
            isIn: [['public', 'private', 'follower']]
        }
    },
    isEdited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    sequelize,
    modelName: 'Post'
});

Post.belongsTo(User, { as: 'author', foreignKey: '_author_id' });
User.hasMany(Post, { as: 'posts', foreignKey: '_author_id' });

export default Post;
