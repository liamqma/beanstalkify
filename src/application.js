import Archive from './archive';
import Environment from './environment';
import deploymentInfo from './deployment-info';
import { S3Client } from '@aws-sdk/client-s3';
import { ElasticBeanstalkClient } from '@aws-sdk/client-elastic-beanstalk';
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
        this.s3 = new S3Client(credentials);
        this.elasticbeanstalk = new ElasticBeanstalkClient(credentials);

        // DI AWS Services
        this.environment = new Environment(this.elasticbeanstalk);
        this.archive = new Archive(this.elasticbeanstalk, this.s3);
    }

    /**
     * @param {object} args - Arguments
     * @param {string} args.archiveFilePath - The path of archive to deploy (e.g. AppName-version.zip)
     * @param {string} args.environmentName - Environment to provision (e.g. my-awesome-app)
     * @param {string} args.awsStackName - Stack to provision (e.g. '64bit Amazon Linux 2015.03 v2.0.0 running Node.js')
     * @param {object} args.beanstalkConfig - Configuration overrides for the environment (optional)
     * @param {object} args.tags - This specifies the tags applied to resources in the environment. (optional)
     * @param {object} args.tier - This specifies the tier ie WebServer (default) or Worker. (optional)
     * @returns {promise} Promise
     */
    deploy(args) {

        const archivePath = args.archiveFilePath;
        const environmentName = args.environmentName;
        const stack = args.awsStackName;
        const config = args.beanstalkConfig;
        const tags = args.tags;
        const tier = args.tier || 'WebServer';

        return q.async(function* () {

            // Upload artifact
            const {versionLabel, applicationName} = yield this.archive.upload(archivePath);

            // Get environment status
            const env = yield this.environment.status(environmentName);

            // If environment does not exist, create a new environment
            // Otherwise, update environment with new version
            if (env) {
                winston.info(`Deploying ${versionLabel} to ${environmentName}...`);
                yield this.environment.deploy(versionLabel, environmentName, stack, config);
                yield this.environment.waitUntilStatusIsNot('Updating', environmentName);
            } else {
                winston.info(`Create stack ${stack} for ${applicationName} - ${versionLabel}`);
                yield this.environment.create(applicationName, environmentName, versionLabel, stack, config, tags, tier);
                yield this.environment.waitUntilStatusIsNot('Launching', environmentName);
            }

            // Wait until environment is ready or timeout
            const environmentDescription = yield this.environment.waitUtilHealthy(environmentName);

            // Return environment info to user
            return deploymentInfo(environmentDescription);
        }.bind(this))();
    }

    terminateEnvironment() {
        return this.environment.terminate.apply(this.environment, arguments);
    }

    cleanApplicationVersions() {
        return this.environment.cleanApplicationVersions.apply(this.environment, arguments);
    }

    deleteApplication(applicationName, terminateEnvByForce = false) {
        return q.ninvoke(
            this.elasticbeanstalk,
            'deleteApplication',
            {
                ApplicationName: applicationName,
                TerminateEnvByForce: terminateEnvByForce
            }
        );
    }
}

export default Application;
