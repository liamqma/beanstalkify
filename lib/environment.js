"use strict";
var q = require('q');
var winston = require('winston');
var async = require('async');

var POLL_INTERVAL = 5;
var STATUS_CHANGE_TIMEOUT = 1200;
var HEALTHY_TIMEOUT = 120;

function Environment(archive, cname, stack, config, elasticbeanstalk) {
    this.archive = archive;
    this.name = cname;
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
                return e.Status;
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

            if (!availability) {
                throw ('DNS (' + this.name + ') is not available');
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
    winston.info('Check ' + this.name + ' availability');
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

/**
 * Wait until status is not {oldStatus}
 * @param {string} oldStatus The old status of environment
 * @returns {promise} Promise
 */
Environment.prototype.waitUntilStatusIsNot = function (oldStatus) {
    var defer = q.defer();
    var timeLeft = STATUS_CHANGE_TIMEOUT;
    var status = null;
    winston.info('Waiting for ' + this.name + ' to finish ' + oldStatus.toLowerCase());
    async.whilst(
        function () {
            if (status === null) {
                return true;
            } else if (timeLeft > 0 && status === oldStatus) {
                return true;
            }
            return false;
        },
        function (callback) {
            this.status()
                .then(function (envStatus) {
                    console.log('.');
                    status = envStatus;
                    timeLeft = timeLeft - POLL_INTERVAL;
                    setTimeout(callback, POLL_INTERVAL * 1000);
                })
                .catch(callback)
                .done();
        }.bind(this),
        function (err) {
            if (err) {
                return defer.reject(err);
            } else {
                return defer.resolve(status);
            }
        }
    );
    return defer.promise;
};

Environment.prototype.waitUtilHealthy = function () {
    var defer = q.defer();
    var timeLeft = HEALTHY_TIMEOUT;
    var healthy = false;
    winston.info('Waiting until ' + this.name + ' is healthy');
    async.whilst(
        function () {
            if (timeLeft > 0 && healthy === false) {
                return true;
            } else {
                return false;
            }
        },
        function (callback) {
            this.describeEnvironment()
                .then(function (data) {
                    console.log('.');
                    healthy = (data.Health === 'Green');
                    timeLeft = timeLeft - POLL_INTERVAL;
                    setTimeout(callback, POLL_INTERVAL * 1000);
                })
                .catch(callback)
                .done();
        }.bind(this),
        function (err) {
            if (err) {
                return defer.reject(err);
            } else {
                return defer.resolve(healthy);
            }
        }
    );
    return defer.promise;
};

module.exports = Environment;
