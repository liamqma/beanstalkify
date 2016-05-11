import test from 'ava';
import q from 'q';
import sinon from 'sinon';
import 'babel-core/register';
import Environment from '../src/environment';

/* Test describeEnvironment */
test('describeEnvironment() should return environment description', function *(t) {

    // Stub
    const elasticbeanstalkStub = {
        describeEnvironments: sinon.stub()
    };
    const environmentDescription = {status: 'Ready'};
    elasticbeanstalkStub.describeEnvironments.yields(null, {Environments: [environmentDescription]});

    // Act
    const environment = new Environment(elasticbeanstalkStub);
    const result = yield environment.describeEnvironment();

    // Assert
    t.same(result, environmentDescription);

});

/* Test status */
test('describeEnvironment() should return environment description', function *(t) {

    // Stub
    const elasticbeanstalkStub = {
        describeEnvironments: sinon.stub()
    };
    elasticbeanstalkStub.describeEnvironments.yields(null, {Environments: [{Status: 'Ready'}]});

    // Act
    const environment = new Environment(elasticbeanstalkStub);
    const result = yield environment.status();

    // Assert
    t.same(result, 'Ready');

});

/* Test create */
test('create() should throw error if DNS is not available', t => {

    const environment = new Environment();
    sinon.stub(environment, 'checkDNSAvailability', () => q(false));
    t.throws(environment.create());

});

/* Test waitUntilStatusIsNot */
test('waitUntilStatusIsNot() should wait', function *(t) {

    const environment = new Environment();
    const statusStub = sinon.stub(environment, 'status');
    const waitStub = sinon.stub(environment, 'wait', () => q());

    statusStub.onCall(0).returns(q('foo'));
    statusStub.onCall(1).returns(q('foo'));
    statusStub.onCall(2).returns(q('bar'));

    const status = yield environment.waitUntilStatusIsNot('foo');
    t.is(status, 'bar');
    t.is(waitStub.callCount, 2);
});

/* Test waitUtilHealthy */
test('waitUtilHealthy() should wait until health and status is ready', function *(t) {
    const environment = new Environment();
    const describeEnvironmentStub = sinon.stub(environment, 'describeEnvironment');
    const waitStub = sinon.stub(environment, 'wait', () => q());

    describeEnvironmentStub.onCall(0).returns(q({Health: 'foo'}));
    describeEnvironmentStub.onCall(1).returns(q({Health: 'foo'}));
    describeEnvironmentStub.onCall(2).returns(q({Health: 'Green', Status: 'Ready'}));

    const environmentDescription = yield environment.waitUtilHealthy();
    t.is(waitStub.callCount, 3);
    t.same(environmentDescription, {Health: 'Green', Status: 'Ready'});
});

test('waitUtilHealthy() should wait until timeout if not healthy', t => {
    const environment = new Environment();
    const describeEnvironmentStub = sinon.stub(environment, 'describeEnvironment');
    const waitStub = sinon.stub(environment, 'wait', () => q());

    describeEnvironmentStub.returns(q({Health: 'foo'}));

    environment.waitUtilHealthy('foo').catch(error => {
        t.is(error.message, 'foo is not healthy');
        t.is(waitStub.callCount, 60);
    });
});

/* Test cleanApplicationVersions */
test('cleanApplicationVersions should delete versions not in use', function *(t) {

    // Stub
    const elasticbeanstalkStub = {
        describeEnvironments: sinon.stub(),
        describeApplicationVersions: sinon.stub()
    };
    elasticbeanstalkStub.describeEnvironments.yields(null, {Environments: [
        {VersionLabel: 'foo'}
    ]});
    elasticbeanstalkStub.describeApplicationVersions.yields(null, {ApplicationVersions: [
        {VersionLabel: 'foo'},
        {VersionLabel: 'bar'},
        {VersionLabel: 'baz'}
    ]});

    // Act
    const environment = new Environment(elasticbeanstalkStub);
    environment.deleteApplicationVersion = sinon.stub();
    yield environment.cleanApplicationVersions('tech-website');

    // Assert
    t.true(environment.deleteApplicationVersion.withArgs({
        ApplicationName: 'tech-website',
        VersionLabel: 'bar',
        DeleteSourceBundle: true
    }).calledOnce);

    t.true(environment.deleteApplicationVersion.withArgs({
        ApplicationName: 'tech-website',
        VersionLabel: 'baz',
        DeleteSourceBundle: true
    }).calledOnce);

    t.false(environment.deleteApplicationVersion.withArgs({
        ApplicationName: 'tech-website',
        VersionLabel: 'foo',
        DeleteSourceBundle: true
    }).called);
});
