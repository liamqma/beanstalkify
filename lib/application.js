"use strict";
var Archive = require('./archive');
var Environment = require('./Environment');
var AWS = require('aws-sdk');
var winston = require('winston');
var q = require('q');

/**
 * @param {object} credentials AWS credentials {accessKeyId, secretAccessKey, region}
 * @param {string} archivePath The path of archive to deploy (e.g. AppName-version.zip)
 * @param {string} envName Environment to provision (e.g. test)
 * @param {string} cname CNAME prefixes to try (e.g. my-awesome-app,my-awesome-app-2)
 * @param {object} config Configuration overrides for the environment (optional)
 * @constructor
 */
function Application(credentials, archivePath, envName, cname, config) {

    winston.level = 'info';
    q.longStackSupport = true;

    var s3 = new AWS.S3(credentials);
    var elasticbeanstalk = new AWS.ElasticBeanstalk(credentials);
    this.stack = '64bit Amazon Linux 2014.03 v1.0.4 running Node.js';
    this.cname = cname;
    this.archive = new Archive(archivePath, s3, elasticbeanstalk);
    this.environment = new Environment(this.archive, envName, this.stack, config, elasticbeanstalk);
}

Application.prototype.deploy = function deploy() {
    this.archive.upload()
        .then(function () {
            return this.environment.status()
                .then(function (env) {

                    if (!env) {

                        winston.info('Create stack ' + this.stack + ' for ' + this.archive.appName + '-' + this.archive.version);
                        return this.environment.create(this.cname);

                    } else {

                        winston.info('Deploying ' + this.archive.version + ' to ' + this.environment.name + '...');
                        return this.environment.deploy();

                    }
                }.bind(this));
        }.bind(this))
        .catch(winston.error)
        .done();
};

module.exports = Application;
