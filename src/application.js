"use strict";
import "babel-polyfill";
import Archive from './archive';
import Environment from './environment';
import deploymentInfo from './deployment-info';
import AWS from 'aws-sdk';
import winston from 'winston';
import q from 'q';


class Application {
    /**
     * @param {object} credentials AWS credentials {accessKeyId, secretAccessKey, region}
     * @constructor
     */
    constructor(credentials) {
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
    deploy(args) {

        const archivePath = args.archiveFilePath;
        const environmentName = args.environmentName;
        const stack = args.awsStackName;
        const config = args.beanstalkConfig;

        const environment = new Environment(this.elasticbeanstalk);
        const archive = new Archive(this.elasticbeanstalk, this.s3);

        return q.async(function* () {
            const {versionLabel, applicationName} = yield archive.upload(archivePath);
            const env = yield environment.status(environmentName);
            if (env) {
                winston.info('Deploying ' + versionLabel + ' to ' + environment.name + '...');
                yield environment.deploy(versionLabel, environmentName, config);
                yield environment.waitUntilStatusIsNot('Updating', environmentName);
            } else {
                winston.info('Create stack ' + stack + ' for ' + applicationName + '-' + versionLabel);
                yield environment.create(applicationName, environmentName, versionLabel, stack, config);
                yield environment.waitUntilStatusIsNot('Launching', environmentName);
            }
            const environmentDescription = yield environment.waitUtilHealthy(environmentName);
            return deploymentInfo(environmentDescription);
        })();
    }
}

export default Application;
