import { Sequelize } from 'sequelize';
import sequelize from '@/db/sql/sequelize';

import User from './User';
import Post from './Post';
import { Follow } from './Follow';
import Notification from './Notification';
import Message from './Message';
import Like from './Like';
import Comment from './Comment';
import NewsFeed from './NewsFeed';
import Bookmark from './Bookmark';
import Chat from './Chat';

const models = {
  User,
  Post,
  Follow,
  Notification,
  Message,
  Like,
  Comment,
  NewsFeed,
  Bookmark,
  Chat,
};

export default {
  ...models,
  sequelize,
  Sequelize,
};