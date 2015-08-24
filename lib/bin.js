"use strict";
/**
var argv = require('yargs').argv;
var Archive = require('./archive');
var configure = require('./configure');
var Environment = require('./environment');
var Application = require('./application');

var keyFile = argv.k; // AWS credentials including access key, secret, and region
var archive = argv.a; // Archive to deploy (e.g. app-name-version.zip)
var envName = argv.e; // Environment to provision (e.g. app-name-test)
var stack = argv.s; // Stack to provision e.g. 64bit Amazon Linux 2015.03 v2.0.0 running Docker Node.js
var cname = argv.n; // CNAME prefixes to try (e.g. my-awesome-app,my-awesome-app-2)
var config = argv.c; // Beanstalk config
var output = argv.o; // File to write YAML environment details for future scripting (optional)

configure(keyFile);
var app = new Application(stack, cname, config);
var archiveInstance = new Archive(archive);
var environment = new Environment(archiveInstance, envName);

app.deploy(archiveInstance, environment);
*/