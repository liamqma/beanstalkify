"use strict";
var q = require('q');
var jsonfile = require('jsonfile');
function DeploymentInfo(environment, archive, path) {
    this.environment = environment;
    this.archive = archive;
    this.path = path;
}

DeploymentInfo.prototype.toJSON = function () {
    var defer = q.defer();
    var data = {
        app_name: this.archive.appName,
        app_version: this.archive.version,
        env_name: this.environment.name
    };
    jsonfile.writeFile(this.path, data, function (err) {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve(true);
        }
    });
    return defer.promise;
};

module.exports = DeploymentInfo;
