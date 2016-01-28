import test from 'ava';
import sinon from 'sinon';
import 'babel-core/register';
import {alreadyUploaded, parse} from '../src/archive';

/* Test alreadyUploaded */
test('alreadyUploaded() should return true if version exists', function *(t) {
    const describeApplicationVersions = sinon.stub();
    describeApplicationVersions.yields(null, {ApplicationVersions: [1]});
    const result = yield alreadyUploaded({describeApplicationVersions});
    t.true(result);
});

test('alreadyUploaded() should return false if version does not exist', function *(t) {
    const describeApplicationVersions = sinon.stub();
    describeApplicationVersions.yields(null, {ApplicationVersions: []});
    const result = yield alreadyUploaded({describeApplicationVersions});
    t.false(result);
});

test('describeApplicationVersions should receive proper arguments', function *(t) {
    t.plan(2);
    const applicationName = 'Application Name';
    const versionLabel = 'Version Label';

    const describeApplicationVersions = (params, callback) => {
        t.is(params.ApplicationName, applicationName);
        t.same(params.VersionLabels, [versionLabel]);
        callback(null, {ApplicationVersions: []});
    };

    yield alreadyUploaded({describeApplicationVersions}, applicationName, versionLabel);
});

/* Test parse */
test('it should parse file name', t => {
    const result = parse('/foo/bar/app-name-version.zip');
    t.is(result.archiveName, 'app-name-version.zip');
    t.is(result.versionLabel, 'version');
    t.is(result.applicationName, 'app-name');
});

