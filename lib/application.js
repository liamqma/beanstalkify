"use strict";
function Application(stack, cname, config) {
    this.stack = stack;
    this.cname = cname.split(',');
    this.config = config;
}

Application.prototype.deploy = function deploy (archive, env) {
    archive.upload()


};

module.exports = Application;