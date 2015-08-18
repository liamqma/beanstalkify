"use strict";
var q = require('q');

var POLL_INTERVAL = 5;
var STATUS_CHANGE_TIMEOUT = 1200;
var HEALTHY_TIMEOUT = 120;

function Environment(archive, envName, stack, config, elasticbeanstalk) {
    this.name = archive.appName + '-' + envName;
    this.elasticbeanstalk = elasticbeanstalk;
    this.config = config;
    this.stack = stack;
}


Environment.prototype.describeEnvironment = function () {

    var defer = q.defer();

    this.elasticbeanstalk.describeEnvironments({
        EnvironmentNames: [this.name],
        IncludeDeleted: false
    }, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(data.Environments.shift());
        }
    });

    return defer.promise;

};

Environment.prototype.status = function () {
    this.describeEnvironment
        .then(function (e) {
            if (e) {
                return e.status;
            } else {
                return '';
            }
        });
};

Environment.prototype.create = function () {
    var defer = q.defer();
    this.elasticbeanstalk.createEnvironment({
        ApplicationName: this.archive.appName,
        VersionLabel: this.archive.version,
        EnvironmentName: this.name,
        SolutionStackName: this.stack,
        OptionSettings: this.config
    }, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(data);
        }
    });
    return defer.promise;
};

Environment.prototype.checkDNSAvailability = function () {
    var defer = q.defer();
    this.elasticbeanstalk.createEnvironment({
        CNAMEPrefix: this.name
    }, function(err, data) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(data.Available);
        }
    });
};

module.exports = Environment;
