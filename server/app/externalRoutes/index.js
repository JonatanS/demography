// /dash

'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var DataSet = mongoose.model('DataSet');
var jwt = require('jsonwebtoken');
var routeUtility = require('../routes/route-utilities.js');
var fsp = require('fs-promise');

var tokenSecret = process.env.TOKEN_SECRET; //TODO: hope this will work once deployed

//https://scotch.io/tutorials/authenticate-a-node-js-api-with-json-web-tokens
// route middleware to verify a token
router.use(function(req, res, next) {
    // check header or url parameters or post parameters for token
    console.log(req.body)
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    console.log("GOT THE TOKEN", token);
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
                req.decoded = decoded._doc;
                next();
            }
        });
    }
    else {
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
    var authenticatedUser = req.decoded;
    DataSet.find({user: authenticatedUser._id}).select('-user -__v')
    .then(allSets => res.status(200).json(allSets))
    .then(null, next);
});

//Route to POST new dataset
// /dash/datasets
router.post("/datasets", function(req, res, next){
    console.log("POSTING");
    var authenticatedUser = req.decoded;

    var filepath, returnDataObject;
console.log(authenticatedUser);
    //var dataArray = routeUtility.convertToFlatJson(JSON.parse(req.body.data.toString()));
    //not sure we need to parse
    var dataArray = (typeof req.body.data === 'string' ? routeUtility.convertToFlatJson(JSON.parse(req.body.data)) : routeUtility.convertToFlatJson(req.body.data));
console.log(dataArray);
    //req.body contains all information for new dataset:
    var metaData = req.body;
    delete metaData.data;
    metaData.user = authenticatedUser._id;

    DataSet.create(metaData)
    .then(dataset => {
        filepath = routeUtility.getFilePath(dataset.user, dataset._id, "application/json");
        fsp.writeFile(filepath, JSON.stringify(dataArray));

        res.status(201).json({success: true, datasetId: dataset._id});
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dataset";
        res.status(422).json({success:false, message: err.message});
    });
});

//Route to UPDATE dataset entries by ID
// /dash/datasets/:id/entries
router.post('/datasets/:id/entries', function(req, res, next){
    console.log('updating');
    var authenticatedUser = req.decoded;
    var datasetId = datasetId = req.params.id;
    var entries = req.body.data;
    console.log(entries);
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
    var filePath = routeUtility.getFilePath(authenticatedUser._id, datasetId, "application/json");
    fsp.readFile(filePath, { encoding: 'utf8' })
    .then(rawFile=> {
        //2. update properties by ID
        var dataArray = JSON.parse(rawFile);

        //loop through entries and add to/ update dataArr
        entries.forEach(function(entry) {
            if(entry.id) {
                var idx = _.indexOf(dataArray, {id: entry.id})
                if(idx != -1) {
                    dataArray[idx] = entry;  //replace old entry
                    respObj.updatedEntries ++;
                }
                else {
                    dataArray.push(entry);
                    respObj.addedEntries ++;
                }
            }
            else if (entry._id) {
                var idx = _.indexOf(dataArray, {_id: entry._id})
                if(idx != -1) {
                    dataArray[idx] = entry;  //replace old entry
                    respObj.updatedEntries ++;
                }
                else {
                    dataArray.push(entry);
                    respObj.addedEntries ++;
                }
            }
        });
        //3. save modified file
        return fsp.writeFile(filePath, JSON.stringify(dataArray));
    })
    .then(savedFile=>{
        metaData.lastUpdated = new Date();
        //4. update 'last updated' property
        return DataSet.findByIdAndUpdate(datasetId, metaData);

    })
    .then(updatedDataSet=>{
        respObj.success = true;
        res.status(201).json(respObj);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dataset";
        res.status(422).json({success:false, message: err.message});
    });
});


//Route to delete entries of existing dataset by ID
// /dash/datasets/:id/entries
router.delete('/datasets/:id/entries', function(req, res, next){
    var authenticatedUser = req.decoded;
    var datasetId = datasetId = req.params.id;
    var entries = req.body.data;
    if(!req.body.data) res.status(422).json({success:false, message: "you must specify id's of entries to delete as {data:[id1,id2,...]}"});
    var metaData = req.body;
    delete metaData.data;
    var respObj = {
        deletedEntries: 0,
        entriesNotDeleted: 0,
        success: false
    };
     //1. load entire file into memory.
    var filePath = routeUtility.getFilePath(authenticatedUser._id, datasetId, "application/json");
    fsp.readFile(filePath, { encoding: 'utf8' })
    .then(rawFile=> {
        //2. update properties by ID
        var dataArray = JSON.parse(rawFile);

        //loop through entries and add to/ update dataArr
        entries.forEach(function(entry) {
            if(entry.id) {
                var idx = _.indexOf(dataArray, {id: entry.id})
                if(idx != -1) {
                    dataArray.splice(idx,1);  //delete entry
                    respObj.deletedEntries ++;
                }
                else respObj.entriesNotDeleted ++;
            }
            else if (entry._id) {
                var idx = _.indexOf(dataArray, {_id: entry._id})
                if(idx != -1) {
                    dataArray.splice(idx,1);  //delete entry
                    respObj.deletedEntries ++;
                }
                else respObj.entriesNotDeleted ++;
            }
        });
        //3. save modified file
        return fsp.writeFile(filePath, JSON.stringify(dataArray));
    })
    .then(savedFile=>{
        metaData.lastUpdated = new Date();
        //4. update 'last updated' property
        return DataSet.findByIdAndUpdate(datasetId, metaData);

    })
    .then(updatedDataSet=>{
        respObj.success = true;
        res.status(201).json(respObj);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dataset";
        res.status(422).json({success:false, message: err.message});
    });
});


