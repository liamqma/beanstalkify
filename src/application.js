import { S3Client } from '@aws-sdk/client-s3';
import { ElasticBeanstalkClient, DeleteApplicationCommand } from '@aws-sdk/client-elastic-beanstalk';
import Archive from './archive';
import Environment from './environment';
import deploymentInfo from './deployment-info';
import winston from 'winston';


class Application {
    /**
     * @param {object} credentials AWS credentials {accessKeyId, secretAccessKey, region}
     * @constructor
     */
    constructor(credentials) {
        // Make debugging easy
        winston.level = 'info';

        const creds = {
            region: credentials.region,
            credentials: credentials.credentials ? credentials.credentials : credentials,
        };

        // AWS Services
        this.s3 = new S3Client(creds);
        this.elasticbeanstalk = new ElasticBeanstalkClient(creds);

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
    async deploy(args) {
        const archivePath = args.archiveFilePath;
        const environmentName = args.environmentName;
        const stack = args.awsStackName;
        const config = args.beanstalkConfig;
        const tags = args.tags;
        const tier = args.tier || 'WebServer';

        // Upload artifact
        const { versionLabel, applicationName } = await this.archive.upload(archivePath);

        // Get environment status
        const env = await this.environment.status(environmentName);

        // If environment does not exist, create a new environment
        // Otherwise, update environment with new version
        if (env) {
            winston.info(`Deploying ${versionLabel} to ${environmentName}...`);
            await this.environment.deploy(versionLabel, environmentName, stack, config);
            await this.environment.waitUntilStatusIsNot('Updating', environmentName);
        } else {
            winston.info(`Create stack ${stack} for ${applicationName} - ${versionLabel}`);
            await this.environment.create(applicationName, environmentName, versionLabel, stack, config, tags, tier);
            await this.environment.waitUntilStatusIsNot('Launching', environmentName);
        }

        // Wait until environment is ready or timeout
        const environmentDescription = await this.environment.waitUtilHealthy(environmentName);

        // Return environment info to user
        return deploymentInfo(environmentDescription);
    }

    terminateEnvironment(environmentName) {
        return this.environment.terminate(environmentName);
    }

    cleanApplicationVersions(applicationName) {
        return this.environment.cleanApplicationVersions(applicationName);
    }

    deleteApplication(applicationName, terminateEnvByForce = false) {
        return this.elasticbeanstalk.send(
            new DeleteApplicationCommand({
                ApplicationName: applicationName,
                TerminateEnvByForce: terminateEnvByForce,
            })
        );
    }
}

export default Application;
