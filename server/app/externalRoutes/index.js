// /dash

'use strict';
var router = require('express').Router();
module.exports = router;

// NPM MODULES
var chalk = require('chalk');
var fsp = require('fs-promise');
var jwt = require('jsonwebtoken');
var mongoose = require('mongoose');
var Promise = require('bluebird');

// MONGOOSE MODELS
var Dashboard = mongoose.model('Dashboard');
var DataSet = mongoose.model('DataSet');
var Widget = mongoose.model('Widget');

// OWN MODULES
var routeUtility = require('../routes/route-utilities.js');
var tokenSecret = require('../../env/index.js').TOKEN_SECRET;

//https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
// route middleware to verify a token
router.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret (and checks exp date)
        jwt.verify(token, tokenSecret, function(err, decoded) {
            if (err) {
                return res.json({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token return an error
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});

//Route to GET all datasets by USER from TOKEN
// /dash/datasets
router.get('/datasets', function(req, res, next) {
    var authenticatedUserId = req.decoded;
    DataSet.find({
            user: authenticatedUserId
        }).select('-user -__v')
        .then(allSets => res.status(200).json(allSets))
        .then(null, next);
});

//Route to POST new dataset
// /dash/datasets
router.post("/datasets", function(req, res) {
    var authenticatedUserId = req.decoded;
    var filePath, awsFileName, datasetId;
    var dataArray = (typeof req.body.data === 'string' ? routeUtility.convertToFlatJson(JSON.parse(req.body.data)) : routeUtility.convertToFlatJson(req.body.data));

    //req.body contains all information for new dataset:

    var templateDashboardId = req.body.templateDashboard;
    var metaData = req.body;
    delete metaData.data;
    delete metaData.token;
    delete metaData.templateDashboard;

    var dashboardId, filepath, dataset;

    metaData.user = authenticatedUserId;

    return DataSet.create(metaData)
        .then(createdDataset => {
            dataset = createdDataset;
            filepath = routeUtility.getFilePath(dataset.user, dataset._id, "application/json");
            fsp.writeFile(filepath, JSON.stringify(dataArray));

            datasetId = dataset._id;
            filePath = routeUtility.getFilePath(dataset.user, dataset._id, "application/json");
            awsFileName = 'user:' + dataset.user + '-dataset:' + dataset._id + '.json';
            return fsp.writeFile(filePath, JSON.stringify(dataArray));
        })
        .then(savedToFS => {
            return routeUtility.uploadFileToS3(filePath, awsFileName)
        })
        .then(savedToAws => {
            //remove temp file:
            fsp.unlink(filePath);
            console.log(chalk.green('Saved to S3!'))
            // if no template dashboard sent, respond with dataset id
            if (!templateDashboardId) {
                console.log(chalk.green('Created dataset from API request! :)'));
                return res.status(201).json({
                    success: true,
                    datasetId: datasetId
                });
            } else {
                return Dashboard.findById(templateDashboardId)
                .then((template) => {

                    if (!template) throw new Error('No matching template found!');

                    const templateDashboard = template.toObject();

                    templateDashboard.title = dataset.title;
                    templateDashboard.shortDescription = dataset.shortDescription;
                    templateDashboard.isPublic = dataset.isPublic;
                    templateDashboard.dataset = dataset._id;

                    delete templateDashboard._id;
                    delete templateDashboard.screenshot;

                    const dashboardProm = Dashboard.create(templateDashboard);
                    const templateWidgetsProm = template.getWidgets();

                    return Promise.all([dashboardProm, templateWidgetsProm]);
                })
                .then((resolvedArr) => {
                    const dashboard = resolvedArr[0];
                    const templateWidgets = resolvedArr[1];

                    dashboardId = dashboard._id;

                    return Promise.map(templateWidgets, (templateWidget) => {
                        templateWidget = templateWidget.toObject();
                        templateWidget.dashboard = dashboard._id;
                        delete templateWidget.lastUpdated;
                        delete templateWidget._id;

                        return Widget.create(templateWidget);
                    });
                })
                .then((widgets) => {
                    console.log(chalk.green("Created dataset and dashboard from API request!"));
                    res.status(201).json({
                        success: true,
                        dashboardId: dashboardId,
                        datasetId: dataset._id
                    });
                })
            }
        })

    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dataset";
        res.status(422).json({
            success: false,
            message: err.message
        });

        console.log(chalk.red('Failed to create relevant things from API request :('));
    });


});

//Route to UPDATE dataset entries by ID
// /dash/datasets/:id/entries
router.post('/datasets/:id/entries', function(req, res) {
    var authenticatedUserId = req.decoded;
    var datasetId = req.params.id;
    var entries = req.body.data;
    //expecting that every entry in the file has a unique id or _id property by which to update.
    //req.body.data [] with id or _id property
    var metaData = req.body;
    delete metaData.data;
    var respObj = {
        addedEntries: 0,
        updatedEntries: 0,
        success: false
    };

    //1. load entire file into memory.
    var filePath = routeUtility.getFilePath(authenticatedUserId, datasetId, "application/json");
    var awsFileName = 'user:' + authenticatedUserId + '-dataset:' + datasetId + '.json';
    return routeUtility.getFileFromS3(filePath, awsFileName)
        .then(awsFile => {
            return fsp.readFile(filePath, {
                encoding: 'utf8'
            })
        })
        .then(rawFile => {
            //2. update properties by ID
            var dataArray = JSON.parse(rawFile);

            //loop through entries and add to/ update dataArr
            entries.forEach(function(entry) {
                if (entry.id) {
                    var idx = dataArray.findIndex(function(element) {
                        return element.id === entry.id
                    });
                    if (idx !== -1) {
                        dataArray[idx] = entry; //replace old entry
                        respObj.updatedEntries++;
                    } else {
                        dataArray.push(entry);
                        respObj.addedEntries++;
                    }
                } else if (entry._id) {
                    var idx = dataArray.findIndex(function(element) {
                        return element._id === entry._id
                    });
                    if (idx !== -1) {
                        dataArray[idx] = entry; //replace old entry
                        respObj.updatedEntries++;
                    } else {
                        dataArray.push(entry);
                        respObj.addedEntries++;
                    }
                }
            });
            //3. save modified file
            return fsp.writeFile(filePath, JSON.stringify(dataArray));
        })
        .then(savedToFS => {
            metaData.lastUpdated = new Date();
            //4. update 'last updated' property
            return DataSet.findByIdAndUpdate(datasetId, metaData);
        })
        .then(updatedDataSet => {
            return routeUtility.uploadFileToS3(filePath, awsFileName)
        })
        .then(savedToAws => {
            //remove temp file:
            fsp.unlink(filePath);
            respObj.success = true;
            res.status(201).json(respObj);
        })
        .then(null, function(err) {
            err.message = "Something went wrong when trying to create this dataset";
            res.status(422).json({
                success: false,
                message: err.message
            });
        });
});


//Route to delete entries of existing dataset by ID
// /dash/datasets/:id/entries
router.delete('/datasets/:id/entries', function(req, res, next) {
    var authenticatedUserId = req.decoded;
    var datasetId = req.params.id;
    var entries = req.body.data;
    if (!req.body.data) res.status(422).json({
        success: false,
        message: "you must specify id's of entries to delete as {data:[{id:1},{_id:2},...]}"
    });
    var metaData = req.body;
    delete metaData.data;
    var respObj = {
        deletedEntries: 0,
        entriesNotDeleted: 0,
        success: false
    };
    //1. load entire file into memory.
    var filePath = routeUtility.getFilePath(authenticatedUserId, datasetId, "application/json");
    var awsFileName = 'user:' + authenticatedUserId + '-dataset:' + datasetId + '.json';
    return routeUtility.getFileFromS3(filePath, awsFileName)
        .then(awsFile => {
            return fsp.readFile(filePath, {
                encoding: 'utf8'
            })
        })
        .then(rawFile => {
            //2. update properties by ID
            var dataArray = JSON.parse(rawFile);

            //loop through entries and add to/ update dataArr
            entries.forEach(function(entry) {
                if (entry.id) {
                    var idx = dataArray.findIndex(function(element, index) {
                        return element.id === entry.id
                    });
                    if (idx != -1) {
                        dataArray.splice(idx, 1); //delete entry
                        respObj.deletedEntries++;
                    } else respObj.entriesNotDeleted++;
                } else if (entry._id) {
                    var idx = dataArray.findIndex(function(element, index) {
                        return element._id === entry._id
                    });
                    if (idx != -1) {
                        dataArray.splice(idx, 1); //delete entry
                        respObj.deletedEntries++;
                    } else respObj.entriesNotDeleted++;
                }
            });
            //3. save modified file
            return fsp.writeFile(filePath, JSON.stringify(dataArray));
        })
        .then(savedFile => {
            metaData.lastUpdated = new Date();
            //4. update 'last updated' property
            DataSet.findByIdAndUpdate(datasetId, metaData);
            return routeUtility.uploadFileToS3(filePath, awsFileName)
        })
        .then(savedToAws => {
            //remove temp file:
            fsp.unlink(filePath);
            respObj.success = true;
            res.status(201).json(respObj);
        })
        .then(null, function(err) {
            err.message = "Something went wrong when trying to create this dataset";
            res.status(422).json({
                success: false,
                message: err.message
            });
        });
});
