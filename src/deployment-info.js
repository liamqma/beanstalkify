"use strict";
export default (environment, describedEnvironment) => {
    return {
        env_name: environment.name,
        env_url: describedEnvironment.CNAME
    };
};
