
import config from '@/config/config';
import * as newsfeedMongo from './newsfeed.service';
import * as newsfeedSql from './newsfeed.sql.service';
import * as followMongo from './follow.service';
import * as followSql from './follow.sql.service';
import * as postMongo from './post.service';
import * as postSql from './post.sql.service';
import * as userSql from './user.sql.service';

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

export default {
    newsfeed: newsfeedService[config.db.type],
    follow: followService[config.db.type],
    post: postService[config.db.type],
    user: userService[config.db.type]
};
