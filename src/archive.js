import q from 'q';
import fs from 'fs';
import path from 'path';
import winston from 'winston';

export function alreadyUploaded(elasticbeanstalk, applicationName, versionLabel) {
    return q.ninvoke(elasticbeanstalk, 'describeApplicationVersions', {ApplicationName: applicationName, VersionLabels: [versionLabel]})
        .then(data => data.ApplicationVersions.length > 0);
}

export function createStorageLocation(elasticbeanstalk) {
    return q.ninvoke(elasticbeanstalk, 'createStorageLocation');
}

export function uploadToS3(s3, bucket, archiveName, filePath) {
    winston.info(`Uploading ${archiveName} to bucket ${bucket}...`);
    return q.ninvoke(s3, 'putObject', {Bucket: bucket, Key: archiveName, Body: fs.readFileSync(filePath)});
}

export function makeApplicationVersionAvailableToBeanstalk(elasticbeanstalk, applicationName, versionLabel, archiveName, bucket) {
    winston.info(`Making version ${versionLabel} of ${applicationName} available to Beanstalk...`);
    return q.ninvoke(elasticbeanstalk, 'createApplicationVersion', {
        ApplicationName: applicationName,
        VersionLabel: versionLabel,
        SourceBundle: {
            S3Bucket: bucket,
            S3Key: archiveName
        },
        AutoCreateApplication: true
    });
}

export function parse(filePath) {
    const archiveName = path.basename(filePath); // website-a-4543cbf.zip
    const baseName = path.basename(filePath, path.extname(filePath)).split('-'); // ['website', 'a', '4543cbf']
    const versionLabel = baseName.pop(); // '4543cbf'
    const applicationName = baseName.join('-'); // 'website-a'
    return {archiveName, versionLabel, applicationName};
}

export function upload({elasticbeanstalk, s3}, filePath) {
    // Step 1
    const {archiveName, versionLabel, applicationName} = parse(filePath);

    return q.async(function* () {
        // Step 2
        const ifAlreadyUploaded = yield alreadyUploaded(elasticbeanstalk, applicationName, versionLabel);

        // Step 3
        if (ifAlreadyUploaded) {
            winston.info(`${versionLabel} is already uploaded.`);
        } else {

            // Step 4,5,6
            const {S3Bucket} = yield createStorageLocation(elasticbeanstalk);
            yield uploadToS3(s3, S3Bucket, archiveName, filePath);
            yield makeApplicationVersionAvailableToBeanstalk(elasticbeanstalk, applicationName, versionLabel, archiveName, S3Bucket);
        }

        return {archiveName, versionLabel, applicationName};
    })();
}
