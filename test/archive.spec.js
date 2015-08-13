"use strict";

var Archive = require('../archive');
var filename = __dirname + '/fixture/sso-login-4543cbf.zip';

describe('Archive', function(){

    it('should should parse file name', function(){

        var archive = new Archive(filename);
        expect(archive.archiveName).to.equal('sso-login-4543cbf.zip');
        expect(archive.version).to.equal('4543cbf');
        expect(archive.appName).to.equal('sso-login');

    });



});