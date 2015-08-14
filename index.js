var argv = require('yargs').argv;
var Archive = require('./archive');
var config = require('./config');

var keyFile = argv.k;
var archive = argv.a;
var envName = argv.e;
var stack = argv.s;
var cname = argv.n;
var config = argv.c;
var output = argv.o;

config(keyFile);
var archive = new Archive(archive);
