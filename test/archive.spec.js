import test from 'ava';
import sinon from 'sinon';
import q from 'q';
import 'babel-core/register';
import Archive from '../src/archive';

/* Test alreadyUploaded */
test('alreadyUploaded() should return true if version exists', async (t) => {
    // Stub
    const mockClient = {
        send: sinon.stub()
    };

    const mockData = {
        ApplicationVersions: [1]
    };

    // eslint-disable-next-line no-undef
    mockClient.send.withArgs(sinon.match.any).returns(Promise.resolve(mockData));

    // Act
    const archive = new Archive(mockClient);
    const result = await archive.alreadyUploaded();

    // Expect
    t.true(result);
});

test('alreadyUploaded() should return false if version does not exist', async (t) => {
    // Stub
    const mockClient = {
        send: sinon.stub()
    };

    const mockData = {
        ApplicationVersions: []
    };

    // eslint-disable-next-line no-undef
    mockClient.send.withArgs(sinon.match.any).returns(Promise.resolve(mockData));

    // Act
    const archive = new Archive(mockClient); // Assuming the constructor takes the client as an argument
    const result = await archive.alreadyUploaded();

    // Expect
    t.false(result);
});

test('describeApplicationVersions should receive proper arguments', function *(t) {
    t.plan(2);
    const applicationName = 'Application Name';
    const versionLabel = 'Version Label';
    const elasticbeanstalkStub = {
        describeApplicationVersions: (params, callback) => {
            t.is(params.ApplicationName, applicationName);
            t.same(params.VersionLabels, [versionLabel]);
            callback(null, {ApplicationVersions: []});
        }
    };

    const archive = new Archive(elasticbeanstalkStub);

    yield archive.alreadyUploaded(applicationName, versionLabel);
});

/* Test parse */
test('it should parse file name', t => {

    const archive = new Archive();

    const result1 = archive.parse('/foo/bar/app-name-version.zip');
    t.is(result1.archiveName, 'app-name-version.zip');
    t.is(result1.versionLabel, 'version');
    t.is(result1.applicationName, 'app-name');

    const result2 = archive.parse('/foo/bar/foo-version.zip');
    t.is(result2.archiveName, 'foo-version.zip');
    t.is(result2.versionLabel, 'version');
    t.is(result2.applicationName, 'foo');
});

test('parse() should throw error if file name is invalid', t => {

    const archive = new Archive();

    t.throws(() => {
        archive.parse('/foo/bar/foo.zip');
    });
});

/* Test upload */
test('upload() should throw error if file name is invalid', t => {
    const archive = new Archive();
    t.throws(archive.upload('/foo/bar/foo.zip'));
});

test('If version already exists, it should not upload again', function *(t) {
    const archive = new Archive();
    sinon.stub(archive, 'alreadyUploaded', () => q(true));
    const createStorageLocationSpy = sinon.spy(archive, 'createStorageLocation');
    const uploadToS3Spy = sinon.spy(archive, 'uploadToS3');
    const makeApplicationVersionAvailableToBeanstalkSpy = sinon.spy(archive, 'makeApplicationVersionAvailableToBeanstalk');
    yield archive.upload('/foo/bar/foo-bar.zip');
    t.false(createStorageLocationSpy.called);
    t.false(uploadToS3Spy.called);
    t.false(makeApplicationVersionAvailableToBeanstalkSpy.called);
});

test('If version does not exist, it should upload', function *(t) {
    const archive = new Archive();
    sinon.stub(archive, 'alreadyUploaded', () => q(false));
    const createStorageLocationSpy = sinon.stub(archive, 'createStorageLocation', () => q({}));
    const uploadToS3Spy = sinon.stub(archive, 'uploadToS3');
    const makeApplicationVersionAvailableToBeanstalkSpy = sinon.stub(archive, 'makeApplicationVersionAvailableToBeanstalk');
    yield archive.upload('/foo/bar/foo-bar.zip');
    t.true(createStorageLocationSpy.called);
    t.true(uploadToS3Spy.called);
    t.true(makeApplicationVersionAvailableToBeanstalkSpy.called);
});
