"use strict";
var path = require('path');
var q = require('q');
var AWS = require('aws-sdk');

var elasticbeanstalk = new AWS.ElasticBeanstalk();

function Archive(filename) {
    this.filename = filename;
    this.archiveName = path.basename(filename);
    var baseName = path.basename(filename, path.extname(filename)).split('-');
    this.version = baseName.pop();
    this.appName = baseName.join('-');
}

Archive.prototype.upload = function () {
    if(this.alreadyUploaded()) {

    }
}

Archive.prototype.alreadyUploaded = function () {
    var defer = q.defer();

    elasticbeanstalk.describeApplicationVersions({
        ApplicationName: this.appName,
        VersionLabels: [this.version]
    }, function (err, data) {
        return defer.reject(err);
        if (data.ApplicationVersions.length > 1) {
            defer.reslove(true)
        } else {
            defer.reslove(false)
        }
    });

    return defer.promise
};

module.exports = Archive;