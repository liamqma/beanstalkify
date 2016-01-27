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
    console.log(data); # {app_name: 'test-website', app_version: 'foo', env_name: 'test-website-prod', env_url: 'tech-website-12345.ap-southeast-2.elasticbeanstalk.com'}
});
```

## Test

```bash
npm test
```
## Release notes
0.0.13 / 2016-01-27
===================

  * Bugfix: check if application version already uploaded
  
0.0.12 / 2016-01-24
===================

  * Upgrade babel 5 to 6
  
0.0.11 / 2016-01-22
===================

  * Change 'env_cname' to 'env_url'
  
0.0.10 / 2016-01-22
===================

  * Add 'env_cname' to returned data
  
0.0.8 / 2015-09-21
===================

  * Reject promise if error occurs during 'makeApplicationVersionAvailableToBeanstalk'

0.0.7 / 2015-09-03
===================

  * Use es6 via babel.js
  
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
  
## Contributors
<table id="contributors"><tr><td><img src=https://avatars.githubusercontent.com/u/4413219?v=3><a href="https://github.com/liamqma">liamqma</a></td><td><img src=https://avatars.githubusercontent.com/u/670701?v=3><a href="https://github.com/Maxwell2022">Maxwell2022</a></td><td><img src=https://avatars.githubusercontent.com/u/46142?v=3><a href="https://github.com/joshhunt">joshhunt</a></td></tr></table>
