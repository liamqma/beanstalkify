[AWS Elastic Beanstalk](http://aws.amazon.com/elasticbeanstalk/) automation. A work in progress.
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
    console.log(data); # {app_name: 'test-website', app_version: 'foo', env_name: 'test-website-prod'}
});
```

## Test

```bash
npm test
```
## Contributors
<table id="contributors"><tr><td><img src=https://avatars.githubusercontent.com/u/4413219?v=3><a href="https://github.com/liamqma">liamqma</a></td><td><img src=https://avatars.githubusercontent.com/u/670701?v=3><a href="https://github.com/Maxwell2022">Maxwell2022</a></td><td><img src=https://avatars.githubusercontent.com/u/46142?v=3><a href="https://github.com/joshhunt">joshhunt</a></td></tr></table>

## Release notes
0.0.6 / 2015-09-01
===================

  * Do not catch the errors and let the deploy method rejecting the promise, catching errors was resolving the deploy promise
  * Reject 'waitUtilHealthy' if environment is not healthy (no Green)
  
0.0.5 / 2015-08-31
===================

  * Use `process.stdout.write` instead of `console.log` to output dots while waiting
  
0.0.4 / 2015-08-27
===================

  * Return environment details from promise chain instead of writing it to a JSON file