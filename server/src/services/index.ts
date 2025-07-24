
import config from '@/config/config';
import * as newsfeedMongo from './newsfeed.service';
import * as newsfeedSql from './newsfeed.sql.service';
import * as followMongo from './follow.service';
import * as followSql from './follow.sql.service';
import * as postMongo from './post.service';
import * as postSql from './post.sql.service';
import * as userSql from './user.sql.service';
import * as notificationSql from './notification.sql.service';
import * as messageSql from './message.sql.service';
import * as likeSql from './like.sql.service';
import * as commentSql from './comment.sql.service';

const newsfeedService = {
    mongodb: newsfeedMongo,
    postgres: newsfeedSql
}

const followService = {
    mongodb: followMongo,
    postgres: followSql
}

const postService = {
    mongodb: postMongo,
    postgres: postSql
}

const userService = {
    postgres: userSql
}

const notificationService = {
    postgres: notificationSql
}

const messageService = {
    postgres: messageSql
}

const likeService = {
    postgres: likeSql
}

const commentService = {
    postgres: commentSql
}

export default {
    newsfeed: newsfeedService[config.db.type],
    follow: followService[config.db.type],
    post: postService[config.db.type],
    user: userService[config.db.type],
    notification: notificationService[config.db.type],
    message: messageService[config.db.type],
    like: likeService[config.db.type],
    comment: commentService[config.db.type]
};
