"use strict";
var Archive = require('./archive');
var Environment = require('./environment');
var deploymentInfo = require('./deployment-info');
var AWS = require('aws-sdk');
var winston = require('winston');
var q = require('q');

/**
 * @param {object} credentials AWS credentials {accessKeyId, secretAccessKey, region}
 * @constructor
 */
function Application(credentials) {

    // Make debugging easy
    winston.level = 'info';
    q.longStackSupport = true;

    // AWS Services
    this.s3 = new AWS.S3(credentials);
    this.elasticbeanstalk = new AWS.ElasticBeanstalk(credentials);
}

/**
 * @param {object} args - Arguments
 * @param {string} args.archiveFilePath - The path of archive to deploy (e.g. AppName-version.zip)
 * @param {string} args.environmentName - Environment to provision (e.g. my-awesome-app)
 * @param {string} args.awsStackName - Stack to provision (e.g. '64bit Amazon Linux 2015.03 v2.0.0 running Node.js')
 * @param {object} args.beanstalkConfig - Configuration overrides for the environment (optional)
 * @returns {promise} Promise
 */
Application.prototype.deploy = function deploy(args) {

    var archivePath = args.archiveFilePath;
    var cname = args.environmentName;
    var stack = args.awsStackName;
    var config = args.beanstalkConfig;

    var archive = new Archive(archivePath, this.s3, this.elasticbeanstalk);
    var environment = new Environment(archive, cname, stack, config, this.elasticbeanstalk);

    return archive.upload()
        .then(function () {
            return environment.status()
                .then(function (env) {
                    if (!env) {
                        winston.info('Create stack ' + stack + ' for ' + archive.appName + '-' + archive.version);
                        return environment.create(cname).then(environment.waitUntilStatusIsNot.bind(environment, 'Launching'));
                    } else {
                      
                        winston.info('Deploying ' + archive.version + ' to ' + environment.name + '...');
                        return environment.deploy().then(environment.waitUntilStatusIsNot.bind(environment, 'Updating'));
                    }

                });
        })
        .then(environment.waitUtilHealthy.bind(environment))
        .then(deploymentInfo.bind(null, archive, environment));
};

module.exports = Application;
