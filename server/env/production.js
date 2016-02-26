/*
    These environment variables are not hardcoded so as not to put
    production information in a repo. They should be set in your
    heroku (or whatever VPS used) configuration to be set in the
    applications environment, along with NODE_ENV=production

 */

'use strict';

module.exports = {
    "DATABASE_URI": process.env.MONGOLAB_URI,
    "SESSION_SECRET": process.env.SESSION_SECRET,
    "TOKEN_SECRET": process.env.TOKEN_SECRET,
    "TWITTER": {
        "consumerKey": process.env.TWITTER_CONSUMER_KEY,
        "consumerSecret": process.env.TWITTER_CONSUMER_SECRET,
        "callbackUrl": process.env.TWITTER_CALLBACK
    },
    "FACEBOOK": {
        "clientID": process.env.FACEBOOK_APP_ID,
        "clientSecret": process.env.FACEBOOK_CLIENT_SECRET,
        "callbackURL": process.env.FACEBOOK_CALLBACK_URL
    },
    "GOOGLE": {
        "clientID": process.env.GOOGLE_CLIENT_ID,
        "clientSecret": process.env.GOOGLE_CLIENT_SECRET,
        "callbackURL": process.env.CALLBACK_URL
    },
    "PHANTOM_SECRET": process.env.PHANTOM_SECRET,
    "PHANTOM_API": process.env.PHANTOM_API,
    "SCREENSHOT_URL": process.env.SCREENSHOT_URL,
    "S3": {
        "ACCESS_KEY_ID":process.env.AWS_ACCESS_KEY_ID,
        "SECRET_ACCESS_KEY":process.env.AWS_SECRET_ACCESS_KEY,
        "SCREENSHOT_URL" : process.env.AWS_SCREENSHOT_URL
    }

};
