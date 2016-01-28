import test from 'ava';
import sinon from 'sinon';
import 'babel-core/register';
import {alreadyUploaded} from '../src/archive';

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
        t.is(params.applicationName, applicationName);
        t.is(params.versionLabel, versionLabel);
        callback(null, {ApplicationVersions: []});
    };

    yield alreadyUploaded({describeApplicationVersions}, applicationName, versionLabel);
});
