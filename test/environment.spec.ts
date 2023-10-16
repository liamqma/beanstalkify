// @ts-nocheck
import Environment from '../src/environment';

describe('Environment Tests', () => {
  it('describeEnvironment() should return environment description', async () => {
    const environmentDescription = { status: 'Ready' };
    const mockResponse = { Environments: [environmentDescription] };

    const elasticbeanstalkStub = {
      send: jest.fn().mockResolvedValueOnce(mockResponse),
    };

    const environment = new Environment(elasticbeanstalkStub);
    const result = await environment.describeEnvironment();

    expect(result).toEqual(environmentDescription);
  });

  it('describeEnvironment() should return environment description', async () => {
    const mockData = {
      Environments: [{ Status: 'Ready' }],
    };

    const mockClient = {
      send: jest.fn().mockResolvedValueOnce(mockData),
    };

    const environment = new Environment(mockClient);
    const result = await environment.status();

    expect(result).toBe('Ready');
  });

  it('create() should throw error if DNS is not available', async () => {
    const environment = new Environment();
    jest
      .spyOn(environment, 'checkDNSAvailability')
      .mockResolvedValueOnce(false);

    await expect(environment.create()).rejects.toThrow();
  });

  it('waitUntilStatusIsNot() should wait', async () => {
    const environment = new Environment();

    jest.spyOn(environment, 'wait').mockResolvedValue(undefined);

    const statusSpy = jest
      .spyOn(environment, 'status')
      .mockResolvedValueOnce('foo')
      .mockResolvedValueOnce('foo')
      .mockResolvedValueOnce('bar');

    const result = await environment.waitUntilStatusIsNot(
      'foo',
      'testEnvironment',
    );

    expect(result).toBe('bar');
    expect(statusSpy).toHaveBeenCalledTimes(3);
  }, 10000); // Increased timeout to 10 seconds for safety

  it('waitUtilHealthy() should wait until health and status is ready', async () => {
    const environment = new Environment();

    jest.spyOn(environment, 'wait').mockResolvedValue(undefined);

    jest
      .spyOn(environment, 'describeEnvironment')
      .mockResolvedValueOnce({ Health: 'foo' })
      .mockResolvedValueOnce({ Health: 'foo' })
      .mockResolvedValueOnce({ Health: 'Green', Status: 'Ready' });

    const environmentDescription = await environment.waitUtilHealthy();

    expect(environmentDescription).toEqual({
      Health: 'Green',
      Status: 'Ready',
    });
  });

  it('waitUtilHealthy() should wait until timeout if not healthy', async () => {
    const environment = new Environment();

    jest.spyOn(environment, 'wait').mockResolvedValue(undefined);

    jest
      .spyOn(environment, 'describeEnvironment')
      .mockResolvedValue({ Health: 'foo' });

    await expect(environment.waitUtilHealthy('foo')).rejects.toThrow(
      'foo is not healthy',
    );
  }, 1000);

  it('cleanApplicationVersions should delete versions not in use', async () => {
    const mockEnvironmentsData = {
      Environments: [{ VersionLabel: 'foo' }],
    };

    const mockApplicationVersionsData = {
      ApplicationVersions: [
        { VersionLabel: 'foo' },
        { VersionLabel: 'bar' },
        { VersionLabel: 'baz' },
      ],
    };

    const mockClient = {
      send: jest.fn(),
    };

    mockClient.send
      .mockImplementationOnce(() =>
        Promise.resolve(mockApplicationVersionsData),
      )
      .mockImplementationOnce(() => Promise.resolve(mockEnvironmentsData));

    const deleteStub = jest.fn();

    const environment = new Environment(mockClient);
    environment.deleteApplicationVersion = deleteStub;
    environment.wait = () => Promise.resolve();

    await environment.cleanApplicationVersions('tech-website');

    expect(deleteStub).toHaveBeenCalledWith({
      ApplicationName: 'tech-website',
      VersionLabel: 'bar',
      DeleteSourceBundle: true,
    });

    expect(deleteStub).toHaveBeenCalledWith({
      ApplicationName: 'tech-website',
      VersionLabel: 'baz',
      DeleteSourceBundle: true,
    });

    expect(deleteStub).not.toHaveBeenCalledWith({
      ApplicationName: 'tech-website',
      VersionLabel: 'foo',
      DeleteSourceBundle: true,
    });
  });
});
