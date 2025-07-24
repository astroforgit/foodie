import config from '@/config/config';
import { User as UserMongo } from '@/schemas';
import UserPostgres from '@/models/User';

class UserService {
    async getUserById(id: any) {
        if (config.db.type === 'postgres') {
            return UserPostgres.findByPk(id);
        } else {
            return UserMongo.findById(id);
        }
    }

    async getUserByUsername(username: string) {
        if (config.db.type === 'postgres') {
            return UserPostgres.findOne({ where: { username } });
        } else {
            return UserMongo.findOne({ username });
        }
    }
}

export default new UserService();