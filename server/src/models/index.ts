import { Sequelize } from 'sequelize';
import sequelize from '@/db/sql/sequelize';

import User from './User';
import Post from './Post';
import { Follow } from './Follow';

const models = {
  User,
  Post,
  Follow,
};

export default {
  ...models,
  sequelize,
  Sequelize,
};