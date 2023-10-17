import assert from 'assert';
import * as http from 'http';
import _ from 'lodash';
import { faker } from '@faker-js/faker';
import Application from '../src/index';
import credentials from './credentials.json';

const application: any = new Application(credentials);

const environmentNameProd = `${faker.person
  .firstName()
  .toLowerCase()}-${faker.number.int()}-prod`;
const environmentNameStag = `${faker.person
  .firstName()
  .toLowerCase()}-${faker.number.int()}-stag`;
const applicationName = 'tech-website';
const versionLabel = 'e812ud';

async function checkEnvironmentHealth(envUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const request = http.get(`http://${envUrl}`, response => {
      if (response.statusCode === 200) {
        resolve();
      } else {
        reject(
          new Error(
            `Failed health check for environment: ${envUrl}. Status: ${response.statusCode}`,
          ),
        );
      }
    });

    request.on('error', error => {
      reject(
        new Error(
          `Failed health check for environment: ${envUrl}. Error: ${error.message}`,
        ),
      );
    });
  });
}

(async () => {
  try {
    // Deploying to Prod environment
    const data = await application.deploy({
      archiveFilePath: `${__dirname}/${applicationName}-${versionLabel}.zip`,
      environmentName: environmentNameProd,
      awsStackName: '64bit Amazon Linux 2023 v6.0.1 running Node.js 18',
      tags: [
        { Key: 'tag1', Value: 'foo' },
        { Key: 'tag2', Value: 'bar' },
      ],
    });
    assert.equal(data.app_name, applicationName);
    assert.equal(data.app_version, versionLabel);
    assert.equal(data.env_name, environmentNameProd);
    await checkEnvironmentHealth(data.env_url);

    // Deploying to Stag environment
    const stagData = await application.deploy({
      archiveFilePath: `${__dirname}/${applicationName}-${versionLabel}.zip`,
      environmentName: environmentNameStag,
      awsStackName: '64bit Amazon Linux 2023 v6.0.1 running Node.js 18',
    });
    assert.equal(stagData.app_name, applicationName);
    assert.equal(stagData.app_version, versionLabel);
    assert.equal(stagData.env_name, environmentNameStag);
    await checkEnvironmentHealth(stagData.env_url);

    // Uploading ZIP archives
    await Promise.all([
      application.archive.upload(`${__dirname}/tech-website-foo.zip`),
      application.archive.upload(`${__dirname}/tech-website-bar.zip`),
      application.archive.upload(`${__dirname}/tech-website-e812ud.zip`),
    ]);

    // Describing application versions
    const appVersionsData =
      await application.elasticbeanstalk.describeApplicationVersions({
        ApplicationName: applicationName,
      });
    const versions = _.map(appVersionsData.ApplicationVersions, 'VersionLabel');
    assert.equal(versions.length, 3);
    assert(versions.includes('foo'));
    assert(versions.includes('bar'));
    assert(versions.includes('e812ud'));

    // Cleaning application versions
    await application.cleanApplicationVersions(applicationName);
    const cleanedAppVersionsData =
      await application.elasticbeanstalk.describeApplicationVersions({
        ApplicationName: applicationName,
      });
    const cleanedVersions = _.map(
      cleanedAppVersionsData.ApplicationVersions,
      'VersionLabel',
    );
    assert.equal(cleanedVersions.length, 1);
    assert(cleanedVersions.includes('e812ud'));
  } catch (error) {
    console.error(error);
  }
})();
