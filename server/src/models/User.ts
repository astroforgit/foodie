
import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import { Follow } from './Follow';

class User extends Model {}

User.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    firstname: {
        type: DataTypes.STRING
    },
    lastname: {
        type: DataTypes.STRING
    }
}, {
    sequelize,
    modelName: 'User'
});

User.hasMany(Follow, { as: 'followers', foreignKey: 'following' });
User.hasMany(Follow, { as: 'following', foreignKey: 'follower' });

export default User;
