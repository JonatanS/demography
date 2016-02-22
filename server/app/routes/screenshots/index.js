'use strict';

var mongoose = require('mongoose');
var router = require('express').Router();
var Pageres = require('pageres');
var path = require("path")
var _ = require("lodash")
var Dashboard = mongoose.model('Dashboard')
module.exports = router;
var jwt = require('jsonwebtoken');
var routeUtility = require('../route-utilities.js');
var fsp = require('fs-promise');

var phantomAPI = require('../../../env/index.js').PHANTOM_API;
var tokenSecret = require('../../../env/index.js').TOKEN_SECRET;
var screenshotUrl = require('../../../env/index.js').SCREENSHOT_URL;
var screenshotPathOnFS = path.join(__dirname, "../../../db/screenshots");
var s3ScreenshotPath = require('../../../env/index.js').S3.SCREENSHOT_URL;

// /api/screenshots
router.post("/", function(req, res, next) {
	var cookieString = `connect.sid=${req.cookies['connect.sid']}`;
    var origFileName, newFileName;
    var pageres = new Pageres({headers: {"x-access-token": phantomAPI, "token": phantomAPI},cookies: [cookieString], filename: req.body.dashboardId, selector: '#main > div > div.gridster.gridster-desktop.gridster-loaded', delay: 1})
        .src(screenshotUrl + req.user._id + '/datasets/' + req.body.datasetId + '/dashboards/' + req.body.dashboardId, ['1024x768'])
        .dest(screenshotPathOnFS)
        .run()
        .then(data => {
            origFileName = data[0].filename;
            newFileName = 'dataset:' + req.body.datasetId + '-dashboard:' + req.body.dashboardId + '.png';
            //post screenshot to AWS:
            return routeUtility.uploadFileToS3(screenshotPathOnFS + '/' + origFileName, newFileName);
        })
        .then(savedToAws => {
            fsp.unlink(screenshotPathOnFS + '/' + origFileName);
            //update Dashboard screenshot parameter:
            //return Dashboard.findByIdAndUpdate(req.body.dashboardId, { screenshot: data[0].filename }, { new: true })
            return Dashboard.findByIdAndUpdate(req.body.dashboardId, { screenshot: s3ScreenshotPath + newFileName }, { new: true });
            //return Dashboard.findByIdAndUpdate(req.body.dashboardId, { screenshot: newFileName }, { new: true });
        })
        .then(updatedDashboard => {
            console.log('Screenshot successfully saved to S3!');
            res.status(200).send(updatedDashboard);
        })
        .then(null, function (err) {
            console.log(err);
            console.log(err.stack);
            next(err);
        })
})
