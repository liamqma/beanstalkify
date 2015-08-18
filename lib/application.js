"use strict";
var Archive = require('./archive');
var Environment = require('./Environment');
var AWS = require('aws-sdk');
var winston = require('winston');

/**
 * @param {object} credentials AWS credentials {accessKeyId, secretAccessKey, region}
 * @param {string} archivePath The path of archive to deploy (e.g. AppName-version.zip)
 * @param {string} envName Environment to provision (e.g. test)
 * @param {object} config Configuration overrides for the environment (optional)
 * @constructor
 */
function Application(credentials, archivePath, envName, config) {

    var stack = '64bit Amazon Linux 2014.03 v1.0.4 running Node.js';

    var s3 = new AWS.S3(credentials);
    var elasticbeanstalk = new AWS.ElasticBeanstalk(credentials);
    this.archive = new Archive(archivePath, s3, elasticbeanstalk);
    this.environment = new Environment(this.archive, envName, stack, config, elasticbeanstalk);
}

Application.prototype.deploy = function deploy() {
    this.archive.upload()
        .then(function () {
            this.environment.status()
                .then(function (env) {
                    if (env) {

                        winston.log('info', 'Create stack ' + this.stack + ' for ' + this.archive.appName + '-' + this.archive.version);
                        this.environment.create();

                    } else {

                    }
                });
        }.bind(this))
        .catch(function (err) {
            console.log(err.stack);
        })
        .done();

};

module.exports = Application;
