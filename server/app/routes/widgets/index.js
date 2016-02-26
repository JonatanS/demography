'use strict';

var mongoose = require('mongoose');
var Widget = mongoose.model('Widget');
var router = require('express').Router();
module.exports = router;

var ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).end();
    }
};

// /api/widgets
router.post("/", ensureAuthenticated, function (req, res, next) {
    Widget.create(req.body)
    .then(newWidget => res.status(201).send(newWidget))
    .then(null, next);
});

router.put("/:id", ensureAuthenticated, function(req, res, next) {
    Widget.findByIdAndUpdate(req.params.id, req.body)
    .then(function(widget) {
        res.status(200).send(widget);
    }).then(null, next);
});

router.delete('/:id', ensureAuthenticated, function (req, res, next){
    Widget.remove({_id: req.params.id})
    .then(null, next);
});

// /api/widgets/:dashboardId
router.get("/:dashboardId", ensureAuthenticated, function (req, res, next) {
    Widget.find({dashboard: dashboardId})
    .then(allWidgets => res.status(200).send(allWidgets))
    .then(null, next);
});
