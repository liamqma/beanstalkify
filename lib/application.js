"use strict";
var Archive = require('./archive');
var AWS = require('aws-sdk');

/**
 * @param {object} credentials AWS credentials {accessKeyId, secretAccessKey, region}
 * @param {string} archivePath The path of archive to deploy (e.g. AppName-version.zip)
 * @param {string} environment Environment to provision (e.g. test)
 * @constructor
 */
function Application(credentials, archivePath, environment) {

    var s3 = new AWS.S3(credentials);
    var elasticbeanstalk = new AWS.ElasticBeanstalk(credentials);
    this.environment = environment;
    this.archive = new Archive(archivePath, s3, elasticbeanstalk);
    this.
}

Application.prototype.deploy = function deploy() {
    this.archive.upload()
        .catch(function (err) {
            console.log(err.stack);
        })
        .done();

};

module.exports = Application;
