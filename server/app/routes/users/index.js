'use strict';

var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var jwt = require('jsonwebtoken');

var phantomSecret = require('../../../env/index.js').PHANTOM_SECRET;
var tokenSecret = require('../../../env/index.js').TOKEN_SECRET;

var phantomAuthenticated = function(req){
    return req.phantom === phantomSecret;
}

var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated() || phantomAuthenticated(req)) {
        next();
    } else {
        res.status(401).send("You are not authenticated");
    }
};


// BOBBY NOTE: Need to add some "admin" controls to these routes, so only they can delete, etc

// Route to retrieve all users
// GET /api/users/
router.get("/", ensureAuthenticated,function(req, res, next) {
    User.find({})
    .then(users => res.status(200).send(users))
    .then(null, next);
});

// Route to retrieve all users
// GET /api/users/:userId
router.get("/:userId", ensureAuthenticated,function(req, res, next) {
    User.findById(req.params.userId)
    .then(user => {
    	if(req.user._id !== req.params.userId){
    		user = user.sanitizeForUser();
    	}
    	res.status(200).send(user)
    })
    .then(null, next);
});

// Route to retrieve all users
// DELETE /api/users/:userId
router.delete("/:userId",ensureAuthenticated, function(req, res, next) {
    User.remove({ _id: req.params.userId })
    .then(response => res.status(200).send("User successfully removed"))
    .then(null, next);
});

//request a token from within our app (cant be done remotely)
router.get("/:id/generateToken",ensureAuthenticated, function (req, res, next) {
    User.findById(req.params.id)
    .then(user => {
        //generate token and send to user
        var token = jwt.sign(user._id.toString(), tokenSecret,{});
        res.status(200).send({success: true, token:token});
    })
    .then(null, next);
});
