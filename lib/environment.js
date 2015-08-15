"use strict";

var POLL_INTERVAL = 5;
var STATUS_CHANGE_TIMEOUT = 1200;
var HEALTHY_TIMEOUT = 120;

function Environment(archive, envName) {
    this.name = archive + '-' + envName;
}

module.exports = Environment;
