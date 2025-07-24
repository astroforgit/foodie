import { DataTypes, Model } from 'sequelize';
import sequelize from '@/db/sql/sequelize';
import User from './User';
import Message from './Message';

class Chat extends Model {}

Chat.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    participants: {
        type: DataTypes.ARRAY(DataTypes.INTEGER),
        allowNull: false,
        defaultValue: []
    },
    lastmessage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: Message,
            key: 'id'
        }
    }
}, {
    sequelize,
    modelName: 'Chat'
});

export default Chat;
