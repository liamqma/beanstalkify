"use strict";
var argv = require('yargs').argv;
var Archive = require('./archive');
var configure = require('./config');

var keyFile = argv.k;
var archive = argv.a;
var envName = argv.e;
var stack = argv.s;
var cname = argv.n;
var config = argv.c;
var output = argv.o;

configure(keyFile);
var archiveInstance = new Archive(archive);
