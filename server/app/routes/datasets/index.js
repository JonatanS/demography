'use strict';

const router = require('express').Router();
module.exports = router;
const mongoose = require('mongoose');
const DataSet = mongoose.model('DataSet');
const User = mongoose.model('User');
const _ = require('lodash');
const fsp = require('fs-promise');
const path = require('path');
//const flatten = require('flat');
const routeUtility = require('../route-utilities.js');

const uploadFolderPath = path.join(__dirname + '/../../../db/upload-files');
const phantomSecret = require('../../../env/index.js').PHANTOM_SECRET;

const phantomAuthenticated = function(req){
    return req.phantom === phantomSecret;
}

const ensureAuthenticated = function (req, res, next) {
    if (req.isAuthenticated() || phantomAuthenticated(req)) {
        next();
    } else {
        res.status(401).send("You are not authenticated");
    }
};


// Route to retrieve all datasets
// This sends metadata only. The GET /:datasetId will need to be used to access the actual data
// GET /api/datasets/
router.get("/", ensureAuthenticated, function(req, res, next) {
    // If a specific user data is requested by a different user, only send the public data
    var queryObject = req.query;
    queryObject.isPublic = true;

    // If a specific user data is requested by the same user, send the private ones back too
    if (queryObject.user && routeUtility.searchUserEqualsRequestUser(queryObject.user, req.user)) delete queryObject.isPublic;
    DataSet.find(queryObject).populate("originalDataset")
    .then(datasets => res.status(200).json(datasets))
    .then(null, function(err) {
        err.message = "Something went wrong when trying to access these datasets";
        next(err);
    });
});

// GET /api/datasets/:datasetId
router.get("/:datasetId", function(req, res, next) {
    var returnDataObject, filePath, awsFileName;
    DataSet.findById(req.params.datasetId)
    .then(dataset => {
        // Throw an error if a different user tries to access a private dataset
        if (!req.headers['user-agent'].includes("PhantomJS")) {
            if (!routeUtility.searchUserEqualsRequestUser(dataset.user, req.user) && !dataset.isPublic) {
                return res.status(401).send("You are not authorized to access this dataset");
            }
        }

        // Save the metadata on the return object
        returnDataObject = dataset.toJSON();

        // Retrieve the file so it can be sent back with the metadata
        filePath = routeUtility.getFilePath(dataset.user, dataset._id);
        awsFileName = 'user:' + dataset.user + '-dataset:' + dataset._id + '.json';
        routeUtility.getFileFromS3(filePath, awsFileName)
        .then(awsResponse =>{
            return fsp.readFile(filePath, { encoding: 'utf8' })
        })
        .then(rawFile => {
            // Convert csv file to a json object if needed
            var dataArray = JSON.parse(rawFile);
            // Add the json as a property of the return object, so it an be sent with the metadata
            returnDataObject.jsonData = dataArray;
            res.status(200).json(returnDataObject);
        });
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to access this dataset";
        next(err);
    });
});

// multer is middleware used to parse the file that is uploaded through the POST request
// This route should come last, so other routes are not affected by this middleware
const multer = require('multer');
const upload = multer({
    dest: uploadFolderPath
});

// Route to create a new dataset in MongoDB and save a renamed csv file to the filesystem
// POST /api/datasets/
router.post('/uploadFile',ensureAuthenticated, upload.single('file'), function(req, res, next) {
    var metaData = req.body,
    originalFilePath = req.file.path,
    newFilePath,
    returnDataObject,
    dataArray;

    metaData.fileType = "application/json";

    if (req.file.mimetype !== "text/csv" && req.file.mimetype !== "application/json") {
        fsp.unlink(originalFilePath);
        res.status(422).send("This is not valid file type. Upload either .csv or .json");
    }

    DataSet.create(metaData)
    .then(dataset => {
        // Save the metadata as the return object and rename the file saved to the filesystem
        returnDataObject = dataset.toJSON();
        newFilePath = routeUtility.getFilePath(dataset.user, dataset._id);
        return fsp.readFile(originalFilePath, { encoding: 'utf8' });
    })
    .then(rawFile => {
        // Convert csv file to a json object if needed, or flatten json object if needed
        dataArray = req.file.mimetype === "application/json" ? routeUtility.convertToFlatJson(JSON.parse(rawFile)) : routeUtility.convertCsvToJson(rawFile);
        // Add the json as a property of the return object, so it an be sent with the metadata
        returnDataObject.jsonData = dataArray;

        // Save file to FS
        return fsp.writeFile(newFilePath, JSON.stringify(dataArray));
    })
    .then(fsResponse => {
        // Save file to AWS
        return routeUtility.uploadFileToS3(newFilePath);
    })
    .then(awsResponse => {
        // Remove temp files and return the saved dataset
        fsp.unlink(originalFilePath);
        fsp.unlink(newFilePath);
        res.status(201).json(returnDataObject);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dataset";
        next(err);
    });
});

// Route to update an existing dataset in MongoDB and overwrite the saved csv file in the filesystem
// POST /api/datasets/:datasetId/updateDataset
router.post('/:datasetId/replaceDataset',ensureAuthenticated, upload.single('file'), function(req, res, next) {
    var metaData = req.body,
    originalFilePath = req.file.path,
    datasetId = req.params.datasetId,
    newFilePath,
    awsFileName,
    returnDataObject,
    dataArray;

    metaData.fileType = "application/json";

    if (req.file.mimetype !== "text/csv" && req.file.mimetype !== "application/json") {
        // Remove temp file
        fsp.unlink(originalFilePath);
        res.status(422).send("This is not valid file type. Upload either .csv or .json");
    }

    DataSet.findByIdAndUpdate(datasetId, metaData)
    .then(originalDataset => {
        return DataSet.findById(originalDataset._id);
    })
    .then(updatedDataset => {
        // Save the metadata on the return object
        returnDataObject = updatedDataset.toJSON();
        newFilePath = routeUtility.getFilePath(updatedDataset.user, updatedDataset._id);
        awsFileName = 'user:' + updatedDataset.user + '-dataset:' + updatedDataset._id + '.json';
        return fsp.readFile(originalFilePath, { encoding: 'utf8' });
    })
    .then(rawFile => {
        // Convert csv file to a json object if needed, or flatten json object if needed
        dataArray = req.file.mimetype === "application/json" ? routeUtility.convertToFlatJson(JSON.parse(rawFile)) : routeUtility.convertCsvToJson(rawFile);
        // Add the json as a property of the return object, so it an be sent with the metadata
        returnDataObject.jsonData = dataArray;
        //remove temp file:
        fsp.unlink(originalFilePath);

        //Save JSON file to FS
        return fsp.writeFile(newFilePath, JSON.stringify(dataArray));
    })
    .then(response => {
        //additionally save to AWS:
        return routeUtility.uploadFileToS3(newFilePath, awsFileName)
    })
    .then(awsResponse => {
        res.status(201).json(returnDataObject);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to create this dataset";
        next(err);
    });
});

// Route to delete an existing dataset in MongoDB and the saved csv file in the filesystem
// DELETE /api/datasets/:datasetId
router.delete("/:datasetId",ensureAuthenticated, function(req, res, next) {
    var filePath, awsFileName, returnData;
    DataSet.findById(req.params.datasetId)
    .then(dataset => {
        returnData = dataset;
        // Throw an error if a different user tries to delete dataset
        if (!routeUtility.searchUserEqualsRequestUser(dataset.user, req.user)) res.status(401).send("You are not authorized to access this dataset");
        filePath = routeUtility.getFilePath(dataset.user, dataset._id);
        awsFileName = 'user:' + dataset.user + '-dataset:' + dataset._id + '.json';
        return dataset.remove();
    })
    .then(dataset => {
        return routeUtility.removeDatasetFromS3(awsFileName)
    })
    .then(AWSresponse => {
        fsp.unlink(filePath);
        res.status(200).send(returnData);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to delete this dataset";
        next(err);
    });
});

// Route to fork a dataset to another user's account
// POST /api/datasets/:datasetId/fork
router.post("/:datasetId/fork",ensureAuthenticated, function(req, res, next) {
    //When forking, make sure the user on the forked dataset is the current logged in user (not the creator of the dataset).
    var clonedDataset = {},
    datasetToFork,
    originalFilePath,
    forkedFilePath,
    returnDataObject,
    dataArray;

    DataSet.findById(req.params.datasetId)
    .then(datasetToFork => {
        // Make sure the dataset being forked is public
        if (!datasetToFork.isPublic) res.status(401).send("You are not authorized to access this dataset");

        // Save the original file path
        originalFilePath = routeUtility.getFilePath(datasetToFork.user, datasetToFork._id);

        // Create a "fork" ofr the dataset metadata and assign it to the req user
        datasetToFork = datasetToFork.toJSON();
        Object.keys(datasetToFork).forEach(prop => {
            if (datasetToFork.hasOwnProperty(prop) && prop !== "_id" && prop !== "__v") {
                clonedDataset[prop] = datasetToFork[prop];
            };
        })
        clonedDataset.user = req.user._id;
        return DataSet.create(clonedDataset);
    })
    .then(forkedDatasetMetadata => {
        // Save the metadata on the return object
        returnDataObject = forkedDatasetMetadata.toJSON();
        // Save the forked file path
        forkedFilePath = routeUtility.getFilePath(forkedDatasetMetadata.user, forkedDatasetMetadata._id);
        return fsp.readFile(originalFilePath, { encoding: 'utf8' });
    })
    .then(rawFile => {
        // Create a new file based on the forked file path
        fsp.writeFile(forkedFilePath, rawFile);
        // Add the json as a property of the return object, so it an be sent with the metadata
        returnDataObject.jsonData = JSON.parse(rawFile);
        res.status(201).json(returnDataObject);
    })
    .then(null, function(err) {
        err.message = "Something went wrong when trying to fork this dataset";
        next(err);
    });
});
