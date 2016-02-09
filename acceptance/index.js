"use strict";
var Application = require('../dist/index');
var credentials = require('./credentials.json');
var assert = require('assert');
var request = require('request');
var q = require('q');
var faker = require('faker');
var _ = require('lodash');

var application = new Application(credentials);

var environmentNameProd = faker.name.firstName().toLowerCase() + '-' + faker.random.number() + '-prod';
var environmentNameStag = faker.name.firstName().toLowerCase() + '-' + faker.random.number() + '-stag';
var applicationName = 'tech-website';
var versionLabel = 'e812ud';

application.deploy({
        archiveFilePath: __dirname + '/' + applicationName + '-' + versionLabel + '.zip',
        environmentName: environmentNameProd,
        awsStackName: '64bit Amazon Linux 2015.09 v2.0.6 running Node.js',
        beanstalkConfig: [
            {
                Namespace: 'aws:elasticbeanstalk:container:nodejs',
                OptionName: 'NodeCommand',
                Value: 'npm start'
            }
        ]
    }
).then(function (data) {

    var deferred = q.defer();

    assert.equal(data.app_name, applicationName);
    assert.equal(data.app_version, versionLabel);
    assert.equal(data.env_name, environmentNameProd);

    request('http://' + data.env_url, function (error, response) {
        if (error) {
            return deferred.reject(error);
        }
        assert.equal(response.statusCode, 200);
        return deferred.resolve(true);
    });

    return deferred.promise;

}).then(function () {
    return application.deploy({
        archiveFilePath: __dirname + '/' + applicationName + '-' + versionLabel + '.zip',
        environmentName: environmentNameStag,
        awsStackName: '64bit Amazon Linux 2015.09 v2.0.6 running Node.js',
        beanstalkConfig: [
            {
                Namespace: 'aws:elasticbeanstalk:container:nodejs',
                OptionName: 'NodeCommand',
                Value: 'npm start'
            }
        ]
    });
}).then(function(data) {

    var deferred = q.defer();

    assert.equal(data.app_name, applicationName);
    assert.equal(data.app_version, versionLabel);
    assert.equal(data.env_name, environmentNameStag);

    request('http://' + data.env_url, function (error, response) {
        if (error) {
            return deferred.reject(error);
        }
        assert.equal(response.statusCode, 200);
        return deferred.resolve(true);
    });

    return deferred.promise;

}).then(function () {

    return q.all([
        application.archive.upload(__dirname + '/tech-website-foo.zip'),
        application.archive.upload(__dirname + '/tech-website-bar.zip'),
        application.archive.upload(__dirname + '/tech-website-e812ud.zip')
    ]);

}).then(function () {

    return q.ninvoke(application.elasticbeanstalk, 'describeApplicationVersions', {
        ApplicationName: applicationName
    });

}).then(function (data) {

    var versions = _.map(data.ApplicationVersions, 'VersionLabel');
    assert.equal(versions.length, 3);
    assert(versions.indexOf('foo') >= 0);
    assert(versions.indexOf('bar') >= 0);
    assert(versions.indexOf('e812ud') >= 0);

}).then(function () {

    return application.cleanApplicationVersions(applicationName);

}).then(function () {

    return q.ninvoke(application.elasticbeanstalk, 'describeApplicationVersions', {
        ApplicationName: applicationName
    });

}).then(function (data) {

    var versions = _.map(data.ApplicationVersions, 'VersionLabel');
    assert.equal(versions.length, 1);
    assert(versions.indexOf('e812ud') >= 0);

}).then(function () {

    // Comment this out if you want to manually checkout the environments created
    //return application.deleteApplication('tech-website', true);

}).catch(console.error).done();
