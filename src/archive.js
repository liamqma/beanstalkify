"use strict";
import path from 'path';
import q from 'q';
import winston from 'winston';
import fs from 'fs';

class Archive {
    /**
     * @param {string} filePath - The path of archive to deploy
     * @param {object} s3 - AWS SDK S3 service interface object
     * @param {object} elasticbeanstalk - AWS SDK S3 service interface object
     * @constructor
     */
    constructor(filePath, s3, elasticbeanstalk) {
        this.elasticbeanstalk = elasticbeanstalk;
        this.s3 = s3;
        this.filePath = filePath;
        this.archiveName = path.basename(filePath); // website-a-4543cbf.zip
        let baseName = path.basename(filePath, path.extname(filePath)).split('-'); // ['website', 'a', '4543cbf']
        this.version = baseName.pop(); // '4543cbf'
        this.appName = baseName.join('-'); // 'website-a'
    }

    upload() {
        return this.alreadyUploaded()
            .then((data) => {
                if (data) {
                    return winston.info(this.version + 'is already uploaded.');
                } else {
                    return this.doUpload();
                }
            });
    }

    doUpload() {

        return this.createStorageLocation()
            .then(this.uploadToS3.bind(this))
            .then(this.makeApplicationVersionAvailableToBeanstalk.bind(this));
    }

    createStorageLocation() {

        var defer = q.defer();

        this.elasticbeanstalk.createStorageLocation(function (err, data) {

            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(data.S3Bucket);
            }
        });

        return defer.promise;
    }

    uploadToS3(bucket) {

        winston.info('Uploading ' + this.archiveName + ' to bucket ' + bucket + '...');
        var defer = q.defer();
        this.s3.putObject({
            Bucket: bucket,
            Key: this.archiveName,
            Body: fs.readFileSync(this.filePath)
        }, function (err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(bucket);
            }
        });
        return defer.promise;
    }

    makeApplicationVersionAvailableToBeanstalk(bucket) {

        winston.info('Making version ' + this.version + ' of ' + this.appName + ' available to Beanstalk...');
        var defer = q.defer();
        this.elasticbeanstalk.createApplicationVersion({
            ApplicationName: this.appName,
            VersionLabel: this.version,
            SourceBundle: {
                S3Bucket: bucket,
                S3Key: this.archiveName
            },
            AutoCreateApplication: true
        }, function (err, data) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(data);
            }
        });

        return defer.promise;
    }


    alreadyUploaded() {
        var defer = q.defer();

        this.elasticbeanstalk.describeApplicationVersions({
            ApplicationName: this.appName,
            VersionLabels: [this.version]
        }, function (err, data) {
            if (err) {
                defer.reject(err);
            } else {
                if (data.ApplicationVersions.length > 1) {
                    defer.resolve(true);
                } else {
                    defer.resolve(false);
                }
            }
        });

        return defer.promise;
    }
}

export default Archive;
