'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var fsp = require('fs-promise');
var path = require('path');
var flatten = require('flat');
var s3 = require('s3');
//var env = require('../../env/index.js');
var env = require('../../env');

var exports = module.exports = {};

// Path where uploaded files are saved
var uploadFolderPath = path.join(__dirname + '/../../db/upload-files');

var filterFloat = function(value) {
    if (/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/
        .test(value))
        return Number(value);
    return undefined; //<--- NaN !== NaN is true, needed to change this to a falsey value
}

// Helper function to construct a file path
exports.getFilePath = function(userId, datasetId) {
    return uploadFolderPath + '/user:' + userId + '-dataset:' + datasetId + '.json';
}

// Helper function to convert csv to json
exports.convertCsvToJson = function(rawFile) {
    var fileStr = rawFile.toString();
    var rawDataArray = fileStr.split("\n").map(function(line, index) {
        return line.split(",").map(function(cell) {
            return cell.replace(/^\s+|\s+$/g, ''); // Trim whitespace
        });
    });
    var headerArray = rawDataArray.shift();

    // Recursively remove empty rows:
    var cleanCounter = 0;
    while (rawDataArray[rawDataArray.length - 1][0] === "") {
        rawDataArray.pop();
        cleanCounter++
    }
    if (cleanCounter > 0) console.log("removed", cleanCounter, "invalid rows from the CSV");

    return rawDataArray.map(function(line) {
        var dataFieldObject = {};
        line.forEach(function(item, index) {
            if (filterFloat(item)) item = filterFloat(item);
            dataFieldObject[headerArray[index]] = item;
        });
        return dataFieldObject;
    });
};

exports.convertToFlatJson = function(rawFile) {
    // If the json is an array of objects, return a flattened array
    if (Array.isArray(rawFile)) {
        return rawFile.map(function(row) {
            return flatten(row, {
                safe: true
            });
        });
    } // If the json is one object, return the flattened object
    else if (typeof rawFile === "object") return flatten(rawFile, {
        safe: true
    });
    else return; // Otherwise return undefined
};

// Helper function to determine if the user in the search is the same as the user making the request
exports.searchUserEqualsRequestUser = function(searchUser, requestUser) {
    if (requestUser) {
        if (searchUser.toString() === requestUser._id.toString()) return true;
    }
    return false;
};

var client = s3.createClient({
    s3Options: {
        accessKeyId: env.S3.ACCESS_KEY_ID,
        secretAccessKey: env.S3.SECRET_ACCESS_KEY
    }
});

exports.uploadFileToS3 = function(fileName) {
    var params = {
        localFile: fileName,
        s3Params: {
            Bucket: "dashjsio",
            Key: fileName
        }
    };

    var uploader = client.uploadFile(params);

    return new Promise((resolve, reject) => {
        uploader.on('error', function(err) {

            console.log("S3 upload failed");
            console.error(err.stack);
            reject(err);
        });
        uploader.on('end', function() {
            resolve();
        });
    });
};

exports.getFileFromS3 = function(fileName) {
    var params = {
        localFile: fileName,
        s3Params: {
            Bucket: "dashjsio",
            Key: fileName
        }
    };

    var downloader = client.downloadFile(params)
    return new Promise((resolve, reject) => {
        downloader.on('error', function(err) {

            console.log("S3 download failed");
            console.error(err.stack);
            reject(err);
        });
        downloader.on('end', function() {
            resolve();
        });
    });
};

exports.removeDatasetFromS3 = function(fileName) {
    var params = {
        Bucket: "dashjsio",
        Delete: {
            Objects:[{Key: fileName}]
        }
    };
    var remover = client.deleteObjects(params)
    return new Promise((resolve, reject) => {
        remover.on('error', function(err) {
            console.error("unable to delete file on S3:", JSON.stringify(err));
            console.error(err.stack);
            reject(err);
        });
        remover.on('end', function() {
            resolve();
        });
    });
};
