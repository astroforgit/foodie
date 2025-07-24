
import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import { Follow } from './Follow';

class User extends Model {
    // Add methods to make it compatible with existing code
    toUserJSON() {
        return {
            id: this.getDataValue('id'),
            email: this.getDataValue('email'),
            username: this.getDataValue('username'),
            firstname: this.getDataValue('firstname'),
            lastname: this.getDataValue('lastname'),
            createdAt: this.getDataValue('createdAt'),
            updatedAt: this.getDataValue('updatedAt')
        };
    }

    toProfileJSON() {
        return this.toUserJSON();
    }
}

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
