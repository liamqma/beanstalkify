import q from 'q';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

class Archive {
    /**
     * @param {object} elasticbeanstalk - AWS SDK
     * @param {object} s3 - AWS SDK
     */
    constructor(elasticbeanstalk, s3) {
        this.elasticbeanstalk = elasticbeanstalk;
        this.s3 = s3;
    }

    /**
     * Check whether application version has already been created
     * @param {string} applicationName
     * @param {string} versionLabel
     * @returns {Promise.<Bool>}
     */
    alreadyUploaded(applicationName, versionLabel) {
        return q.ninvoke(this.elasticbeanstalk, 'describeApplicationVersions', {ApplicationName: applicationName, VersionLabels: [versionLabel]})
            .then(data => data.ApplicationVersions.length > 0);
    }

    /**
     * Create the Amazon S3 storage location
     * @returns {Promise.<T>} Return {S3Bucket} The name of the Amazon S3 bucket created
     */
    createStorageLocation() {
        return q.ninvoke(this.elasticbeanstalk, 'createStorageLocation');
    }

    /**
     * Upload file to S3
     * @param {string} bucket - The name of the Amazon S3 bucket created
     * @param {string} archiveName
     * @param {string} filePath
     * @returns {Promise.<T>} Promise
     */
    uploadToS3(bucket, archiveName, filePath) {
        winston.info(`Uploading ${archiveName} to bucket ${bucket}...`);
        return q.ninvoke(this.s3, 'putObject', {Bucket: bucket, Key: archiveName, Body: fs.readFileSync(filePath)});
    }

    /**
     * Creates an application version for the specified application
     * @param {string} applicationName
     * @param {string} versionLabel
     * @param {string} archiveName
     * @param {string} bucket - The name of the Amazon S3 bucket created
     * @returns {Promise.<T>} Promise
     */
    makeApplicationVersionAvailableToBeanstalk(applicationName, versionLabel, archiveName, bucket) {
        winston.info(`Making version ${versionLabel} of ${applicationName} available to Beanstalk...`);
        return q.ninvoke(this.elasticbeanstalk, 'createApplicationVersion', {
            ApplicationName: applicationName,
            VersionLabel: versionLabel,
            SourceBundle: {
                S3Bucket: bucket,
                S3Key: archiveName
            },
            AutoCreateApplication: true
        });
    }

    /**
     * Parse the file path
     * @param {string} filePath - File path of the artifact
     * @returns {{archiveName: string, versionLabel: string, applicationName: string}} Object
     */
    parse(filePath) {
        const archiveName = path.basename(filePath); // website-a-4543cbf.zip
        const baseName = path.basename(filePath, path.extname(filePath)).split('-'); // ['website', 'a', '4543cbf']
        if (baseName.length <= 1) {
            throw new Error("Please make sure file name includes application name and version label separated by '-'. e.g. tech-website-1d595d3");
        }
        const versionLabel = baseName.pop(); // '4543cbf'
        const applicationName = baseName.join('-'); // 'website-a'
        return {archiveName, versionLabel, applicationName};
    }

    /**
     * Upload artifact to application and make application version available
     * @param {string} filePath - File path of the artifact
     * @returns {Promise.<T>} Promise
     */
    upload(filePath) {

        return q.async(function* () {
            // Step 1
            const {archiveName, versionLabel, applicationName} = this.parse(filePath);

            // Step 2
            const ifAlreadyUploaded = yield this.alreadyUploaded(applicationName, versionLabel);

            // Step 3
            if (ifAlreadyUploaded) {
                winston.info(`${versionLabel} is already uploaded.`);
            } else {

                // Step 4,5,6
                const {S3Bucket} = yield this.createStorageLocation();
                yield this.uploadToS3(S3Bucket, archiveName, filePath);
                yield this.makeApplicationVersionAvailableToBeanstalk(applicationName, versionLabel, archiveName, S3Bucket);
            }

            return {archiveName, versionLabel, applicationName};

        }.bind(this))();
    }
}

export default Archive;
