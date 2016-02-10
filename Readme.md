[AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/) automation.
This is the node version of [Ruby Beanstalkify](https://github.com/pranavraja/beanstalkify/) 

[![Build Status](https://travis-ci.org/liamqma/beanstalkify.svg?branch=master)](https://travis-ci.org/liamqma/beanstalkify)
[![Coverage Status](https://coveralls.io/repos/liamqma/beanstalkify/badge.svg?branch=master&service=github)](https://coveralls.io/github/liamqma/beanstalkify?branch=master)

## Install
```bash
    npm install beanstalkify --save
```

## Usage

```javascript
var Application = require('beanstalk');
var application = new Application(
    {
        accessKeyId: 'XXX',
        secretAccessKey: 'XXX',
        region: 'ap-southeast-2'
    }
);

application.deploy(
{
    archiveFilePath: 'PATH TO ZIP FILE',
    environmentName: 'CNAME',
    awsStackName: '64bit Amazon Linux 2015.03 v2.0.0 running Node.js',
    beanstalkConfig: [
        Beanstalk options
        ....
    ]
}
).then(function(data){
    console.log(data); # {app_name: 'test-website', app_version: 'foo', env_name: 'test-website-prod', env_url: 'tech-website-12345.ap-southeast-2.elasticbeanstalk.com'}
});
```

## Clean application versions
```javascript
application.cleanApplicationVersions('application name'); // Returns a promise
```

## Unit test

```bash
npm test
```

## Acceptance test
1. Create `credentials.json` within folder `acceptance`
```JSON
{
    "accessKeyId": "XXX",
    "secretAccessKey": "XXX",
    "region": "ap-southeast-2"
}
```
2. Run `node acceptance/index.js`
3. It should create automatically two random elasticbeanstalk environments 

## Change Log

This project adheres to [Semantic Versioning](http://semver.org/).  
Every release, along with the migration instructions, is documented on the Github [Releases](https://github.com/liamqma/beanstalkify/releases) page.
  
## Contributors
<table id="contributors"><tr><td><img src=https://avatars.githubusercontent.com/u/4413219?v=3><a href="https://github.com/liamqma">liamqma</a></td><td><img src=https://avatars.githubusercontent.com/u/670701?v=3><a href="https://github.com/Maxwell2022">Maxwell2022</a></td><td><img src=https://avatars.githubusercontent.com/u/46142?v=3><a href="https://github.com/joshhunt">joshhunt</a></td></tr></table>
