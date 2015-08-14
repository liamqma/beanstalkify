"use strict";
var path = require('path');
var q = require('q');
var AWS = require('aws-sdk');
var winston = require('winston');
var fs = require('fs');

var elasticbeanstalk = new AWS.ElasticBeanstalk();
var s3 = new AWS.S3();

function Archive(filename) {
    this.filename = filename;
    this.archiveName = path.basename(filename);
    var baseName = path.basename(filename, path.extname(filename)).split('-');
    this.version = baseName.pop();
    this.appName = baseName.join('-');
};

Archive.prototype.upload = function () {

    this.alreadyUploaded()
        .then(function (data) {

            if (data)
                return winston.log('info', this.version + 'is already uploaded.');
            else
                return this.doUpload();

        }.bind(this));

};

Archive.prototype.doUpload = function () {

    return this.createStorageLocation()
        .then(this.uploadToS3.bind(this))
        .then(this.makeApplicationVersionSvailableToBeanstalk.bind(this))


};

Archive.prototype.createStorageLocation = function () {

    var defer = q.defer();

    elasticbeanstalk.createStorageLocation(function (err, data) {

        if (err)
            defer.reject(err);
        else
            defer.reslove(data['S3Bucket'])
    });

    return defer.promise;
};

Archive.prototype.uploadToS3 = function (bucket) {

    winston.log('info', 'Uploading ' + this.archiveName + ' to bucket ' + bucket + '...');

    var defer = q.defer();

    s3.putObject({
        Bucket: bucket,
        key: this.archiveName,
        Body: fs.readFileSync(this.filename)
    }, function (err, data) {

        if (err)
            defer.reject(err);
        else
            defer.reslove(bucket)

    });

    return defer.promise;
};

Archive.prototype.makeApplicationVersionSvailableToBeanstalk = function (bucket) {

    winston.log('info', 'Making version ' + this.version + ' of ' + this.appName + ' available to Beanstalk...');

    var defer = q.defer();

    elasticbeanstalk.createApplicationVersion({
        ApplicationName: this.appName,
        VersionLabel: this.version,
        SourceBundle: {
            S3Bucket: bucket,
            S3Key: this.archiveName
        },
        AutoCreateApplication: true
    }, function (err, data) {

    });

    return defer.promise;
};


Archive.prototype.alreadyUploaded = function () {
    var defer = q.defer();

    elasticbeanstalk.describeApplicationVersions({
        ApplicationName: this.appName,
        VersionLabels: [this.version]
    }, function (err, data) {
        if (err)
            defer.reject(err);
        else {
            if (data.ApplicationVersions.length > 1) {
                defer.reslove(true)
            } else {
                defer.reslove(false)
            }
        }
    });

    return defer.promise;
};

module.exports = Archive;