import q from 'q';
import fs from 'fs';
import path from 'path';

export function alreadyUploaded(elasticbeanstalk, applicationName, versionLabel) {
    return q.nfcall(elasticbeanstalk.describeApplicationVersions, {applicationName, versionLabel})
        .then(data => data.ApplicationVersions.length > 0 );
}

export function createStorageLocation(elasticbeanstalk) {
    return q.nfcall(elasticbeanstalk.createStorageLocation);
}

export function uploadToS3(s3, bucket, archiveName, filePath) {
    return q.nfcall(s3.putObject, {Bucket: bucket, key: archiveName, Body: fs.readFileSync(filePath)});
}

export function makeApplicationVersionAvailableToBeanstalk(elasticbeanstalk, applicationName, versionLabel) {

}

export function parse(filePath) {
    const archiveName = path.basename(filePath); // website-a-4543cbf.zip
    const baseName = path.basename(filePath, path.extname(filePath)).split('-'); // ['website', 'a', '4543cbf']
    const versionLabel = baseName.pop(); // '4543cbf'
    const applicationName = baseName.join('-'); // 'website-a'
    return {archiveName, versionLabel, applicationName};
}

export function upload({elasticbeanstalk, s3}, filePath) {
    const {archiveName, versionLabel, applicationName} = parse(filePath);
    return q.aync(function *() {
        const ifAlreadyUploaded = yield alreadyUploaded(elasticbeanstalk, applicationName, versionLabel);
        if (ifAlreadyUploaded) {

        } else {

        }
    });
}