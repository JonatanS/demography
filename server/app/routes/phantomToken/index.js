'use strict';

var router = require('express').Router();
module.exports = router;
var jwt = require('jsonwebtoken');
var tokenSecret = require('../../../env/index.js').TOKEN_SECRET;


//This middleware will check if there is a token on the request header and place the decoded token on the request.
router.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret (and checks exp date)
        jwt.verify(token, tokenSecret, function(err, decoded) {
            if (err) {
                console.log("Error in middleware:", err);
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.phantom = decoded;
            }
        });
    }
    next();

});
