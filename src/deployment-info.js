"use strict";
export default (archive, environment, describedEnvironment) => {
    return {
        app_name: archive.appName,
        app_version: archive.version,
        env_name: environment.name,
        env_url: describedEnvironment.CNAME
    };
};
