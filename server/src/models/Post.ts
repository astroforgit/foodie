
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
    description: {
        type: DataTypes.STRING
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
