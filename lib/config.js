"use strict";
var AWS = require('aws-sdk');
var yaml = require('js-yaml');
var fs = require('fs');


module.exports = function config(keyFile) {

    var credentials = yaml.safeLoad(fs.readFileSync(keyFile, 'utf8'));

    AWS.config.update({
        accessKeyId: credentials.access_key_id,
        secretAccessKey: credentials.secret_access_key,
        region: credentials.region
    });

};
