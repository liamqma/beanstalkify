"use strict";
var q = require('q');
var winston = require('winston');

var POLL_INTERVAL = 5;
var STATUS_CHANGE_TIMEOUT = 1200;
var HEALTHY_TIMEOUT = 120;

function Environment(archive, envName, stack, config, elasticbeanstalk) {
    this.archive = archive;
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
    return this.describeEnvironment()
        .then(function (e) {
            if (e) {
                return e.status;
            } else {
                return '';
            }
        });
};

/**
 * Assuming the archive has already been uploaded,
 * create a new environment with the app deployed onto the provided stack.
 * Attempts to use the first available cname in the cnames array.
 * @param {string} cname CNAME prefixes to try
 * @returns {promise} Promise
 */
Environment.prototype.create = function (cname) {
    return this.checkDNSAvailability()
        .then(function (availability) {

            if (availability) {
                return winston.info('DNS in not available');
            }

            var defer = q.defer();
            this.elasticbeanstalk.createEnvironment({
                ApplicationName: this.archive.appName,
                VersionLabel: this.archive.version,
                EnvironmentName: this.name,
                SolutionStackName: this.stack,
                OptionSettings: this.config,
                CNAMEPrefix: cname
            }, function (err, data) {
                if (err) {
                    defer.reject(err);
                } else {
                    defer.resolve(data);
                }
            });
            return defer.promise;
        }.bind(this));
};

Environment.prototype.checkDNSAvailability = function () {
    var defer = q.defer();
    this.elasticbeanstalk.checkDNSAvailability({
        CNAMEPrefix: this.name
    }, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(data.Available);
        }
    });
    return defer.promise;
};

Environment.prototype.deploy = function () {
    var defer = q.defer();
    this.elasticbeanstalk.updateEnvironment({
        VersionLabel: this.archive.version,
        EnvironmentName: this.name,
        OptionSettings: this.config
    }, function (err, data) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(data.Available);
        }
    });
    return defer.promise;
};

module.exports = Environment;
