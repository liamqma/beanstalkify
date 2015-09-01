"use strict";
module.exports = function(archive, environment) {
    return {
        app_name: archive.appName,
        app_version: archive.version,
        env_name: environment.name
    };
};
