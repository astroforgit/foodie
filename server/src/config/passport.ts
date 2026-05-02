import User, { IUser } from '@/schemas/UserSchema';
import UserPostgres from '@/models/User';
import config from '@/config/config';
import bcrypt from 'bcrypt';
import FacebookStrategy from 'passport-facebook';
import GitHubStrategy from 'passport-github';
import GoogleStrategy from 'passport-google-oauth2';
import LocalStrategy from 'passport-local';


export default function (passport) {
    passport.serializeUser(function (user: any, done: any) {
        const userId = config.db.type === 'postgres' ? user.id : user._id;
        done(null, userId);
        console.log('SERIALIZE', user)
    });

    // used to deserialize the user
    passport.deserializeUser(async function (id: string, done: any) {
        try {
            let user;
            if (config.db.type === 'postgres') {
                user = await UserPostgres.findByPk(id);
            } else {
                user = await User.findById(id);
            }
            done(null, user);
        } catch (err) {
            console.log('ERR', err);
            done(err, null);
        }
    });

    passport.use('local-register', new LocalStrategy.Strategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true // allows us to pass back the entire request to the callback
    }, async (req, email, password, done) => {
        try {
            let existingUser;
            if (config.db.type === 'postgres') {
                existingUser = await UserPostgres.findOne({ where: { email } });
            } else {
                existingUser = await User.findOne({ email });
            }

            if (existingUser) {
                return done(null, false, { message: 'Email already has been already used by other user.' });
            }

            if (config.db.type === 'postgres') {
                // Hash password for PostgreSQL
                const saltRounds = 10;
                const hashedPassword = await bcrypt.hash(password, saltRounds);

                const newUser = await UserPostgres.create({
                    email,
                    password: hashedPassword,
                    username: req.body.username
                });
                return done(null, newUser);
            } else {
                const newUser = new User({ email, password, username: req.body.username });
                await newUser.save();
                return done(null, newUser);
            }
        } catch (err) {
            return done(err);
        }
    })
    );

    passport.use(
        'local-login',
        new LocalStrategy.Strategy({
            usernameField: 'username',
            passwordField: 'password',
            passReqToCallback: true
        }, async (req, username, password, done) => {
            try {
                let user;
                if (config.db.type === 'postgres') {
                    user = await UserPostgres.findOne({ where: { username } });
                } else {
                    user = await User.findOne({ username });
                }

                if (user) {
                    if (config.db.type === 'postgres') {
                        // For PostgreSQL, compare password directly with bcrypt
                        const match = await bcrypt.compare(password, user.password);
                        if (match) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: 'Incorrect credentials.' });
                        }
                    } else {
                        // For MongoDB, use the existing passwordMatch method
                        user.passwordMatch(password, function (err, match) {
                            if (err) {
                                return done(err);
                            }
                            if (match) {
                                return done(null, user);
                            } else {
                                return done(null, false, {
                                    message: 'Incorrect credentials.'
                                });
                            }
                        });
                    }
                } else {
                    return done(null, false, { message: 'Incorrect credentials.' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.use(
        'facebook-auth',
        new FacebookStrategy.Strategy({
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: `/api/v1/auth/facebook/callback`,
            profileFields: ['id', 'profileUrl', 'email', 'displayName', 'name', 'gender', 'picture.type(large)']
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const fbProfile = profile._json;
                const email = fbProfile.email || (profile.emails && profile.emails[0] && profile.emails[0].value);
                const firstName = fbProfile.first_name || (profile.name && profile.name.givenName);
                const lastName = fbProfile.last_name || (profile.name && profile.name.familyName);
                const picture = fbProfile.picture ? fbProfile.picture.data.url : '';

                if (config.db.type === 'postgres') {
                    let user = await UserPostgres.findOne({ where: { email } });

                    if (user) {
                        return done(null, user);
                    } else {
                        const randomString = Math.random().toString(36).substring(2);
                        const saltRounds = 10;
                        const hashedPassword = await bcrypt.hash(randomString, saltRounds);

                        const newUser = await UserPostgres.create({
                            email,
                            password: hashedPassword,
                            username: email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, ''),
                            firstname: firstName,
                            lastname: lastName
                        });
                        return done(null, newUser);
                    }
                } else {
                    const user = await User.findOne({ provider_id: fbProfile.id });

                    if (user) {
                        return done(null, user);
                    } else {
                        const randomString = Math.random().toString(36).substring(2);

                        const newUser = new User({
                            username: email.split('@')[0],
                            email,
                            password: randomString,
                            firstname: firstName,
                            lastname: lastName,
                            profilePicture: {
                                url: picture
                            },
                            provider_id: fbProfile.id,
                            provider: 'facebook',
                            provider_access_token: accessToken,
                            provider_refresh_token: refreshToken
                        });

                        newUser.save(function (err) {
                            if (err) {
                                done(null, false, err);
                            } else {
                                console.log('SUCCESSFULLY CREATED', newUser);
                                done(null, newUser);
                            }
                        });
                    }
                }
            } catch (err) {
                console.log(err);
                return done(err);
            }
        }
        )
    );

    passport.use(
        'github-auth',
        new GitHubStrategy.Strategy({
            clientID: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            callbackURL: `/api/v1/auth/github/callback`,
            scope: 'user:email'
        }, async (accessToken, refreshToken, profile, done) => {
            try {
                const githubProfile: any = profile._json;
                const email = githubProfile.email || (profile.emails && profile.emails[0] && profile.emails[0].value);
                const nameParts = githubProfile.name ? githubProfile.name.split(' ') : [];
                const firstName = nameParts[0] || (profile.name && profile.name.givenName) || '';
                const lastName = nameParts[1] || (profile.name && profile.name.familyName) || '';
                const avatarUrl = githubProfile.avatar_url || (profile.photos && profile.photos[0] && profile.photos[0].value) || '';

                if (config.db.type === 'postgres') {
                    let user = await UserPostgres.findOne({ where: { email } });

                    if (user) {
                        return done(null, user);
                    } else {
                        const randomString = Math.random().toString(36).substring(2);
                        const saltRounds = 10;
                        const hashedPassword = await bcrypt.hash(randomString, saltRounds);

                        const newUser = await UserPostgres.create({
                            email,
                            password: hashedPassword,
                            username: githubProfile.login.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                            firstname: firstName,
                            lastname: lastName
                        });
                        return done(null, newUser);
                    }
                } else {
                    const user = await User.findOne({ provider_id: githubProfile.id });

                    if (user) {
                        return done(null, user);
                    } else {
                        const randomString = Math.random().toString(36).substring(2);

                        const newUser = new User({
                            username: githubProfile.login,
                            email,
                            password: randomString,
                            firstname: firstName,
                            lastname: lastName,
                            profilePicture: {
                                url: avatarUrl
                            },
                            provider_id: githubProfile.id,
                            provider: 'github',
                            provider_access_token: accessToken,
                            provider_refresh_token: refreshToken
                        });

                        newUser.save(function (err) {
                            if (err) {
                                console.log(err);
                                done(null, false, err);
                            } else {
                                console.log('SUCCESSFULLY CREATED', newUser);
                                done(null, newUser);
                            }
                        });
                    }
                }
            } catch (err) {
                console.log(err);
                return done(err);
            }
        }
        )
    );

    passport.use(
        'google-auth',
        new GoogleStrategy.Strategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: `/api/v1/auth/google/callback`
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const json = profile._json;
                    const email = json.email || (profile.emails && profile.emails[0] && profile.emails[0].value);
                    const givenName = json.given_name || (profile.name && profile.name.givenName);
                    const familyName = json.family_name || (profile.name && profile.name.familyName);
                    const picture = json.picture || (profile.photos && profile.photos[0] && profile.photos[0].value);

                    if (config.db.type === 'postgres') {
                        let user = await UserPostgres.findOne({ where: { email } });

                        if (user) {
                            return done(null, user);
                        } else {
                            const randomString = Math.random().toString(36).substring(2);
                            const randomNumber = Math.floor(Math.random() * 100);
                            const saltRounds = 10;
                            const hashedPassword = await bcrypt.hash(randomString, saltRounds);

                            const newUser = await UserPostgres.create({
                                email,
                                password: hashedPassword,
                                username: `${givenName}_${familyName}${randomNumber}`.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                                firstname: givenName,
                                lastname: familyName
                            });
                            return done(null, newUser);
                        }
                    } else {
                        const user = await User.findOne({ provider_id: profile.id });

                        if (user) {
                            return done(null, user);
                        } else {
                            const randomString = Math.random().toString(36).substring(2);
                            const randomNumber = Math.floor(Math.random() * 100);
                            const photo = picture ? { url: picture } : {};

                            const newUser = new User({
                                username: `${givenName}_${familyName}${randomNumber}`,
                                email,
                                password: randomString,
                                firstname: givenName,
                                lastname: familyName,
                                profilePicture: photo,
                                provider_id: profile.id,
                                provider: 'google',
                                provider_access_token: accessToken,
                                provider_refresh_token: refreshToken
                            });

                            newUser.save(function (err) {
                                if (err) {
                                    done(null, false, err);
                                } else {
                                    console.log('SUCCESSFULLY CREATED', newUser);
                                    done(null, newUser);
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.log(err);
                    return done(err);
                }
            }
        )
    );

};
