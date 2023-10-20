import {
    CheckDNSAvailabilityCommand,
    CreateEnvironmentCommand,
    DeleteApplicationVersionCommand,
    DescribeApplicationVersionsCommand,
    DescribeEnvironmentsCommand,
    TerminateEnvironmentCommand,
    UpdateEnvironmentCommand,
} from '@aws-sdk/client-elastic-beanstalk';
import _ from 'lodash';
import { logger } from './utils/logger';

const POLL_INTERVAL = 5; // In seconds
const STATUS_CHANGE_TIMEOUT = 1200; // In seconds
const HEALTHY_TIMEOUT = 300; // In seconds

class Environment {
    private elasticbeanstalk: any;

    constructor(elasticbeanstalk: any) {
        this.elasticbeanstalk = elasticbeanstalk;
    }

    /**
     * @param {string} environmentName - e.g. tech-website-prod
     * @returns {Promise}
     */
    describeEnvironment(environmentName: any) {
        const command = new DescribeEnvironmentsCommand({
            EnvironmentNames: [environmentName],
            IncludeDeleted: false,
        });

        return this.elasticbeanstalk
            .send(command)
            .then((data: any) => data.Environments.shift());
    }

    async status(...args: any) {
        // @ts-ignore
        const environment = await this.describeEnvironment(...args);
        return environment ? environment.Status : null;
    }

    /**
     * @param {string} applicationName
     * @param {string} environmentName
     * @param {string} versionLabel
     * @param {string} stack
     * @param {array} config
     * @param {array} tags
     * @param {string} tier
     * @returns {*}
     */
    async create(
        applicationName: any,
        environmentName: any,
        versionLabel: any,
        stack: any,
        config: any,
        tags = [],
        tier = 'WebServer',
    ) {
        const availability = await this.checkDNSAvailability(environmentName);
        if (!availability) {
            throw new Error(`DNS ${environmentName} is not available`);
        }

        const options =
            tier === 'Worker'
                ? {
                      ApplicationName: applicationName,
                      VersionLabel: versionLabel,
                      EnvironmentName: environmentName,
                      SolutionStackName: stack,
                      OptionSettings: config,
                      Tags: tags,
                      Tier: {
                          Name: tier,
                          Type: 'SQS/HTTP',
                      },
                  }
                : {
                      ApplicationName: applicationName,
                      VersionLabel: versionLabel,
                      EnvironmentName: environmentName,
                      SolutionStackName: stack,
                      OptionSettings: config,
                      CNAMEPrefix: environmentName,
                      Tags: tags,
                      Tier: {
                          Name: tier,
                          Type: 'Standard',
                      },
                  };

        const command = new CreateEnvironmentCommand(options);
        return await this.elasticbeanstalk.send(command);
    }

    async deploy(
        versionLabel: any,
        environmentName: any,
        stack: any,
        config: any,
    ) {
        const updateConfig: any = {
            VersionLabel: versionLabel,
            EnvironmentName: environmentName,
            OptionSettings: config,
        };

        if (stack) {
            updateConfig.SolutionStackName = stack;
        }

        const command = new UpdateEnvironmentCommand(updateConfig);
        return await this.elasticbeanstalk.send(command);
    }

    async waitUntilStatusIsNot(oldStatus: any, environmentName: any) {
        logger.info(
            `Waiting for ${environmentName} to finish ${oldStatus.toLowerCase()}`,
        );

        let timeLeft = STATUS_CHANGE_TIMEOUT;
        let status = await this.status(environmentName);

        while (timeLeft > 0 && status === oldStatus) {
            process.stdout.write('.');
            status = await this.status(environmentName);
            timeLeft = timeLeft - POLL_INTERVAL;
            await this.wait(POLL_INTERVAL);
        }

        process.stdout.write('\n');
        return status;
    }

    async waitUtilHealthy(environmentName: any) {
        logger.info(`Waiting until ${environmentName} is healthy`);

        let timeLeft = HEALTHY_TIMEOUT;
        let environmentDescription: any = {};

        while (
            timeLeft > 0 &&
            (environmentDescription.Health !== 'Green' ||
                environmentDescription.Status !== 'Ready')
        ) {
            process.stdout.write('.');
            environmentDescription =
                await this.describeEnvironment(environmentName);
            if (typeof environmentDescription !== 'object') {
                throw new Error(
                    `Failed to heath check environment: ${environmentName}. Maybe the environment is terminated.`,
                );
            }
            timeLeft = timeLeft - POLL_INTERVAL;
            await this.wait(POLL_INTERVAL);
        }

        if (
            typeof environmentDescription !== 'object' ||
            environmentDescription.Health !== 'Green' ||
            environmentDescription.Status !== 'Ready'
        ) {
            throw new Error(`${environmentName} is not healthy`);
        }
        process.stdout.write('\n');
        return environmentDescription;
    }

    wait(seconds: any) {
        return new Promise(resolve => {
            setTimeout(resolve, seconds * 1000);
        });
    }

    async checkDNSAvailability(environmentName: any) {
        logger.info(`Check ${environmentName} availability`);

        const command = new CheckDNSAvailabilityCommand({
            CNAMEPrefix: environmentName,
        });
        const response = await this.elasticbeanstalk.send(command);

        return response.Available;
    }

    async terminate(environmentName: any) {
        logger.info(`Terminating Environment named ${environmentName}...`);

        const command = new TerminateEnvironmentCommand({
            EnvironmentName: environmentName,
        });
        return await this.elasticbeanstalk.send(command);
    }

    /**
     * @param {object} params - e.g. {ApplicationName: 'XXX', VersionLabel: 'XXX', DeleteSourceBundle: true}
     * @returns {promise}
     */
    async deleteApplicationVersion(params: any) {
        const command = new DeleteApplicationVersionCommand(params);
        return await this.elasticbeanstalk.send(command);
    }

    /**
     * Delete application versions based on application name
     * @param {string} applicationName
     * @returns {promise}
     */
    async cleanApplicationVersions(applicationName: any) {
        logger.info(`Clean application versions of ${applicationName}...`);

        const describeAppVersionsCommand =
            new DescribeApplicationVersionsCommand({
                ApplicationName: applicationName,
            });
        const applicationVersionsResponse = await this.elasticbeanstalk.send(
            describeAppVersionsCommand,
        );
        const applicationVersions =
            applicationVersionsResponse.ApplicationVersions.map(
                (v: any) => v.VersionLabel,
            );

        const describeEnvironmentsCommand = new DescribeEnvironmentsCommand({
            ApplicationName: applicationName,
            IncludeDeleted: false,
        });
        const environmentsResponse = await this.elasticbeanstalk.send(
            describeEnvironmentsCommand,
        );
        const applicationVersionsToKeep = environmentsResponse.Environments.map(
            (e: any) => e.VersionLabel,
        );

        const applicationVersionsToDelete = _.difference(
            applicationVersions,
            applicationVersionsToKeep,
        );

        for (const version of applicationVersionsToDelete) {
            logger.info(`Delete version: ${version}`);

            // eslint-disable-next-line no-undef
            await new Promise(resolve => setTimeout(resolve, 1000)); // Sleep for 1 second

            await this.deleteApplicationVersion({
                ApplicationName: applicationName,
                VersionLabel: version,
                DeleteSourceBundle: true,
            });
        }
    }
}

export default Environment;
