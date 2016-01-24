"use strict";
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
        let archivePath = args.archiveFilePath;
        let cname = args.environmentName;
        let stack = args.awsStackName;
        let config = args.beanstalkConfig;

        let archive = new Archive(archivePath, this.s3, this.elasticbeanstalk);
        let environment = new Environment(archive, cname, stack, config, this.elasticbeanstalk);

        return archive.upload()
            .then(function () {
                return environment.status()
                    .then(function (env) {
                        if (!env) {
                            winston.info('Create stack ' + stack + ' for ' + archive.appName + '-' + archive.version);
                            return environment.create(cname).then(environment.waitUntilStatusIsNot.bind(environment, 'Launching'));
                        } else {

                            winston.info('Deploying ' + archive.version + ' to ' + environment.name + '...');
                            return environment.deploy().then(environment.waitUntilStatusIsNot.bind(environment, 'Updating'));
                        }

                    });
            })
            .then(environment.waitUtilHealthy.bind(environment))
            .then(environment.describeEnvironment.bind(environment))
            .then(deploymentInfo.bind(null, archive, environment));
    }
}

export default Application;
