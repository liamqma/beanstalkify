"use strict";

var Archive = require('../lib/archive');
var filename = __dirname + '/fixture/app-name-version.zip';

describe('Archive', function(){

    it('should should parse file name', function(){

        var archive = new Archive(filename);
        expect(archive.archiveName).to.equal('app-name-version.zip');
        expect(archive.version).to.equal('version');
        expect(archive.appName).to.equal('app-name');

    });



});