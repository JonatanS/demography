'use strict';

var authConfig = require('../../secrets.js');
//process.env.TOKEN_SECRET = "qE19G2Lnmf8EXE60gdztw8ajMHfTc0S9"; // BOBBY NOTE: This looks like a dupe with the token listed below
module.exports = {
  // "DATABASE_URI": "mongodb://localhost:27017/demography",
  "DATABASE_URI": authConfig.DATABASE_URI,
  "SESSION_SECRET": "Optimus Prime is my real dad",
  "TWITTER": {
    "consumerKey": "INSERT_TWITTER_CONSUMER_KEY_HERE",
    "consumerSecret": "INSERT_TWITTER_CONSUMER_SECRET_HERE",
    "callbackUrl": "INSERT_TWITTER_CALLBACK_HERE"
  },
  "FACEBOOK": {
    "clientID": "INSERT_FACEBOOK_CLIENTID_HERE",
    "clientSecret": "INSERT_FACEBOOK_CLIENT_SECRET_HERE",
    "callbackURL": "INSERT_FACEBOOK_CALLBACK_HERE"
  },
  "GOOGLE": {
    "clientID": "298064356219-e3hi8qkfat96nsvmae2ojggorn5mcn7n.apps.googleusercontent.com",
    "clientSecret": "rIwPdYD8FBtQu0aEsprOb9Bl",
    "callbackURL": "http://localhost:1337/auth/google/callback"
  },
  "TOKEN_SECRET": authConfig.TOKEN_SECRET,
  "PHANTOM_SECRET": authConfig.PHANTOM_SECRET,
  "PHANTOM_API": authConfig.PHANTOM_API,
  "SCREENSHOT_URL" : 'http://localhost:1337/users/',
  "S3": {
    "ACCESS_KEY_ID":authConfig.S3.ACCESS_KEY_ID,
    "SECRET_ACCESS_KEY":authConfig.S3.SECRET_ACCESS_KEY,
    "SCREENSHOT_URL":authConfig.S3.SCREENSHOT_URL
  }
};
