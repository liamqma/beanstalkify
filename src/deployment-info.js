export default (environmentDescription) => {
    return {
        app_name: environmentDescription.ApplicationName,
        app_version: environmentDescription.VersionLabel,
        env_name: environmentDescription.EnvironmentName,
        env_url: environmentDescription.CNAME
    };
};
