import q from 'q';

export function alreadyUploaded(elasticbeanstalk, applicationName, versionLabel) {
    return q.nfcall(elasticbeanstalk.describeApplicationVersions, {applicationName, versionLabel})
        .then(data => data.ApplicationVersions.length > 0);
}
