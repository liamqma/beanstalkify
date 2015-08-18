"use strict";
var path = require('path');
var q = require('q');
var winston = require('winston');
var fs = require('fs');

function Archive (filename, s3, elasticbeanstalk) {
    this.elasticbeanstalk = elasticbeanstalk;
    this.s3 = s3;
    this.filename = filename;
    this.archiveName = path.basename(filename); // website-a-4543cbf.zip
    var baseName = path.basename(filename, path.extname(filename)).split('-'); // ['website', 'a', '4543cbf']
    this.version = baseName.pop(); // '4543cbf'
    this.appName = baseName.join('-'); // 'website-a'
}

Archive.prototype.upload = function () {

    return this.alreadyUploaded()
        .then(function (data) {
            if (data) {
                return winston.info(this.version + 'is already uploaded.');
            } else {
                return this.doUpload();
            }
        }.bind(this));

};

Archive.prototype.doUpload = function () {

    return this.createStorageLocation()
        .then(this.uploadToS3.bind(this))
        .then(this.makeApplicationVersionAvailableToBeanstalk.bind(this));

};

Archive.prototype.createStorageLocation = function () {

    var defer = q.defer();

    this.elasticbeanstalk.createStorageLocation(function (err, data) {

        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(data.S3Bucket);
        }
    });

    return defer.promise;
};

Archive.prototype.uploadToS3 = function (bucket) {

    winston.info('Uploading ' + this.archiveName + ' to bucket ' + bucket + '...');

    var defer = q.defer();

    this.s3.putObject({
        Bucket: bucket,
        Key: this.archiveName,
        Body: fs.readFileSync(this.filename)
    }, function (err) {

        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(bucket);
        }
    });

    return defer.promise;
};

Archive.prototype.makeApplicationVersionAvailableToBeanstalk = function (bucket) {

    winston.info('Making version ' + this.version + ' of ' + this.appName + ' available to Beanstalk...');

    var defer = q.defer();

    this.elasticbeanstalk.createApplicationVersion({
        ApplicationName: this.appName,
        VersionLabel: this.version,
        SourceBundle: {
            S3Bucket: bucket,
            S3Key: this.archiveName
        },
        AutoCreateApplication: true
    }, function (err, data) {
        if (err) {
            defer.resolve(false);
        } else {
            defer.resolve(data);
        }
    });

    return defer.promise;
};


Archive.prototype.alreadyUploaded = function () {
    var defer = q.defer();

    this.elasticbeanstalk.describeApplicationVersions({
        ApplicationName: this.appName,
        VersionLabels: [this.version]
    }, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            if (data.ApplicationVersions.length > 1) {
                defer.resolve(true);
            } else {
                defer.resolve(false);
            }
        }
    });

    return defer.promise;
};

module.exports = Archive;
