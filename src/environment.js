"use strict";
import q from 'q';
import winston from 'winston';
import async from 'async';

const POLL_INTERVAL = 5;
const STATUS_CHANGE_TIMEOUT = 1200;
const HEALTHY_TIMEOUT = 120;

class Environment {

    constructor(archive, cname, stack, config, elasticbeanstalk) {
        this.archive = archive;
        this.name = cname;
        this.elasticbeanstalk = elasticbeanstalk;
        this.config = config;
        this.stack = stack;
    }

    describeEnvironment() {
        let defer = q.defer();

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
    }

    status() {
        return this.describeEnvironment()
            .then(function (e) {
                if (e) {
                    return e.Status;
                } else {
                    return '';
                }
            });
    }

    /**
     * Assuming the archive has already been uploaded,
     * create a new environment with the app deployed onto the provided stack.
     * Attempts to use the first available cname in the cnames array.
     * @param {string} cname CNAME prefixes to try
     * @returns {promise} Promise
     */
    create(cname) {
        return this.checkDNSAvailability()
            .then((availability) => {

                if (!availability) {
                    throw ('DNS (' + this.name + ') is not available');
                }

                let defer = q.defer();
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
            });
    }

    checkDNSAvailability() {
        winston.info('Check ' + this.name + ' availability');
        let defer = q.defer();
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
    }

    deploy() {
        let defer = q.defer();
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
    }

    /**
     * Wait until status is not {oldStatus}
     * @param {string} oldStatus The old status of environment
     * @returns {promise} Promise
     */
    waitUntilStatusIsNot(oldStatus) {
        let defer = q.defer();
        let timeLeft = STATUS_CHANGE_TIMEOUT;
        let status = null;
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
            (callback) => {
                this.status()
                    .then(function (envStatus) {
                        process.stdout.write('.');
                        status = envStatus;
                        timeLeft = timeLeft - POLL_INTERVAL;
                        setTimeout(callback, POLL_INTERVAL * 1000);
                    })
                    .catch(callback)
                    .done();
            },
            function (err) {
                if (err) {
                    return defer.reject(err);
                } else {
                    return defer.resolve(status);
                }
            }
        );
        return defer.promise;
    }

    waitUtilHealthy() {
        let defer = q.defer();
        let timeLeft = HEALTHY_TIMEOUT;
        let healthy = false;
        winston.info('Waiting until ' + this.name + ' is healthy');
        async.whilst(
            function () {
                if (timeLeft > 0 && healthy === false) {
                    return true;
                } else {
                    return false;
                }
            },
            (callback) => {
                this.describeEnvironment()
                    .then(function (data) {
                        process.stdout.write('.');
                        healthy = (data.Health === 'Green');
                        timeLeft = timeLeft - POLL_INTERVAL;
                        setTimeout(callback, POLL_INTERVAL * 1000);
                    })
                    .catch(callback)
                    .done();
            },
            (err) => {
                if (err) {
                    return defer.reject(err);
                } else if (healthy === false) {
                    return defer.reject(new Error(this.name + ' is not healthy'));
                } else {
                    return defer.resolve(healthy);
                }
            }
        );
        return defer.promise;
    }
}

export default Environment;
