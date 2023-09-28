import test from 'ava';
import q from 'q';
import sinon from 'sinon';
import 'babel-core/register';
import Environment from '../src/environment';
import {DescribeApplicationVersionsCommand, DescribeEnvironmentsCommand} from '@aws-sdk/client-elastic-beanstalk';

/* Test describeEnvironment */
test('describeEnvironment() should return environment description', async (t) => {
    // Stub
    const environmentDescription = { status: 'Ready' };
    const mockResponse = { Environments: [environmentDescription] };

    const elasticbeanstalkStub = {
        send: sinon.stub().returns(Promise.resolve(mockResponse))
    };

    // Act
    const environment = new Environment(elasticbeanstalkStub);
    const result = await environment.describeEnvironment();

    // Assert
    t.same(result, environmentDescription);
});


/* Test status */
test('describeEnvironment() should return environment description', async (t) => {

    // Mock data
    const mockData = {
        Environments: [{ Status: 'Ready' }]
    };

    // Stub
    const mockClient = {
        send: sinon.stub().returns(Promise.resolve(mockData))
    };

    // Act
    const environment = new Environment(mockClient);
    const result = await environment.status();

    // Assert
    t.is(result, 'Ready');

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
test('cleanApplicationVersions should delete versions not in use', async (t) => {
    // Mock data
    const mockEnvironmentsData = {
        Environments: [
            { VersionLabel: 'foo' }
        ]
    };

    const mockApplicationVersionsData = {
        ApplicationVersions: [
            { VersionLabel: 'foo' },
            { VersionLabel: 'bar' },
            { VersionLabel: 'baz' }
        ]
    };

    // Stub
    const mockClient = {
        send: sinon.stub()
    };

    // Stub the send method with appropriate returns
    mockClient.send
        .withArgs(sinon.match.instanceOf(DescribeEnvironmentsCommand))
        .returns(Promise.resolve(mockEnvironmentsData));

    mockClient.send
        .withArgs(sinon.match.instanceOf(DescribeApplicationVersionsCommand))
        .returns(Promise.resolve(mockApplicationVersionsData));

    // Create a stub for the deleteApplicationVersion method
    const deleteStub = sinon.stub();

    // Act
    const environment = new Environment(mockClient);
    environment.deleteApplicationVersion = deleteStub;
    environment.wait = () => Promise.resolve();

    try {
        await environment.cleanApplicationVersions('tech-website');
    } catch (error) {
        console.error('Test Error:', error);
        throw error;
    }

    // Assert
    t.true(deleteStub.calledWith({
        ApplicationName: 'tech-website',
        VersionLabel: 'bar',
        DeleteSourceBundle: true
    }));

    t.true(deleteStub.calledWith({
        ApplicationName: 'tech-website',
        VersionLabel: 'baz',
        DeleteSourceBundle: true
    }));

    t.false(deleteStub.calledWith({
        ApplicationName: 'tech-website',
        VersionLabel: 'foo',
        DeleteSourceBundle: true
    }));
});
