[AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/) automation.
This is the node version of [Ruby Beanstalkify](https://github.com/pranavraja/beanstalkify/)

[![Build Status](https://travis-ci.org/liamqma/beanstalkify.svg?branch=master)](https://travis-ci.org/liamqma/beanstalkify)
[![Coverage Status](https://coveralls.io/repos/liamqma/beanstalkify/badge.svg?branch=master&service=github)](https://coveralls.io/github/liamqma/beanstalkify?branch=master)

## Prerequisites
- **Node.js**: Requires Node.js version 18 or higher. Make sure to have the appropriate version installed before using Beanstalkify.
```bash
node --version
```
- **ts-node**: Necessary for running the acceptance tests. Ensure you have ts-node installed globally or as a development dependency.
```bash
npm install -g ts-node
```
OR
```bash
npm install ts-node --save-dev
```

## Install
```bash
npm install beanstalkify
```

## Usage

```typescript
import Beanstalkify from 'beanstalkify';

const beanstalkify = new Beanstalkify({
  credentials: {
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY'
  },
  region: 'ap-southeast-2'
});

// Deploy configuration
const deployConfig = {
  archiveFilePath: 'PATH_TO_YOUR_ZIP_FILE',
  environmentName: 'YOUR_ENVIRONMENT_NAME',
  awsStackName: '64bit Amazon Linux 2023 v6.0.1 running Node.js 18',
  tags: [
    {
      Key: 'YOUR_TAG_KEY',
      Value: 'YOUR_TAG_VALUE'
    },
    // ... additional tags as needed
  ]
};

// Deploy using async/await
async function deployApp() {
  try {
    const data = await beanstalkify.deploy(deployConfig);
    /*
    Outputs:
    {
      appName: 'test-website',
      appVersion: 'foo',
      envName: 'test-website-prod',
      envUrl: 'tech-website-12345.ap-southeast-2.elasticbeanstalk.com'
    }
    */
    console.log(data);
  } catch (error) {
    console.error('Error during deployment:', error);
  }
}

deployApp();
```

## Unit test

```bash
npm run test
```

## Acceptance test
- Create `credentials.json` within folder `acceptance`
```JSON
{
  "credentials": {
    "accessKeyId": "XXX",
    "secretAccessKey": "XXX"
  },
  "region": "ap-southeast-2"
}

```
- Run `ts-node acceptance/index.ts`
- It should create automatically two random elasticbeanstalk environments


## Change Log

This project adheres to [Semantic Versioning](http://semver.org/).
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/liamqma/beanstalkify/releases) page.

## Contributors
<table id="contributors"><tr><td width="25%"><img src=https://avatars.githubusercontent.com/u/4413219?v=3><a href="https://github.com/liamqma">liamqma</a></td><td width="25%"><img src=https://avatars2.githubusercontent.com/u/4636949?s=460&u=76bbb42e88cbb6315be84918b417a6d1831ac1f9&v=4><a href="https://github.com/lucascanavan">lucascanavan</a></td><td width="25%"><img src=https://avatars.githubusercontent.com/u/670701?v=3><a href="https://github.com/Maxwell2022">Maxwell2022</a></td><td width="25%"><img src=https://avatars.githubusercontent.com/u/46142?v=3><a href="https://github.com/joshhunt">joshhunt</a></td></tr></table>
