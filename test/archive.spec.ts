// @ts-nocheck
import Archive from '../src/archive';

describe('Archive', () => {
  it('alreadyUploaded() should return true if version exists', async () => {
    const mockClient = {
      send: jest.fn().mockResolvedValue({ ApplicationVersions: [1] }),
    };

    const archive = new Archive(mockClient);
    const result = await archive.alreadyUploaded();

    expect(result).toBe(true);
  });

  it('alreadyUploaded() should return false if version does not exist', async () => {
    const mockClient = {
      send: jest.fn().mockResolvedValue({ ApplicationVersions: [] }),
    };

    const archive = new Archive(mockClient);
    const result = await archive.alreadyUploaded();

    expect(result).toBe(false);
  });

  it('describeApplicationVersions should receive proper arguments', async () => {
    const applicationName = 'Application Name';
    const versionLabel = 'Version Label';

    const mockClient = {
      send: jest.fn(params => {
        expect(params.input.ApplicationName).toBe(applicationName);
        expect(params.input.VersionLabels).toEqual([versionLabel]);
        return Promise.resolve({ ApplicationVersions: [] });
      }),
    };

    const archive = new Archive(mockClient);
    await archive.alreadyUploaded(applicationName, versionLabel);
  });

  it('it should parse file name', () => {
    const archive = new Archive();

    const result1 = archive.parse('/foo/bar/app-name-version.zip');
    expect(result1.archiveName).toBe('app-name-version.zip');
    expect(result1.versionLabel).toBe('version');
    expect(result1.applicationName).toBe('app-name');

    const result2 = archive.parse('/foo/bar/foo-version.zip');
    expect(result2.archiveName).toBe('foo-version.zip');
    expect(result2.versionLabel).toBe('version');
    expect(result2.applicationName).toBe('foo');
  });

  it('parse() should throw error if file name is invalid', () => {
    const archive = new Archive();

    expect(() => {
      archive.parse('/foo/bar/foo.zip');
    }).toThrow();
  });

  it('upload() should throw error if file name is invalid', async () => {
    const archive = new Archive();
    await expect(archive.upload('/foo/bar/foo.zip')).rejects.toThrow();
  });

  it('If version already exists, it should not upload again', async () => {
    const archive = new Archive();

    jest.spyOn(archive, 'alreadyUploaded').mockResolvedValue(true);
    const createStorageLocationSpy = jest.spyOn(
      archive,
      'createStorageLocation',
    );
    const uploadToS3Spy = jest.spyOn(archive, 'uploadToS3');
    const makeApplicationVersionAvailableToBeanstalkSpy = jest.spyOn(
      archive,
      'makeApplicationVersionAvailableToBeanstalk',
    );

    await archive.upload('/foo/bar/foo-bar.zip');

    expect(createStorageLocationSpy).not.toHaveBeenCalled();
    expect(uploadToS3Spy).not.toHaveBeenCalled();
    expect(
      makeApplicationVersionAvailableToBeanstalkSpy,
    ).not.toHaveBeenCalled();
  });

  it('If version does not exist, it should upload', async () => {
    const archive = new Archive();

    jest.spyOn(archive, 'alreadyUploaded').mockResolvedValue(false);
    const createStorageLocationSpy = jest
      .spyOn(archive, 'createStorageLocation')
      .mockResolvedValue({});
    const uploadToS3Spy = jest
      .spyOn(archive, 'uploadToS3')
      .mockResolvedValue({});
    const makeApplicationVersionAvailableToBeanstalkSpy = jest
      .spyOn(archive, 'makeApplicationVersionAvailableToBeanstalk')
      .mockResolvedValue({});

    await archive.upload('/foo/bar/foo-bar.zip');

    expect(createStorageLocationSpy).toHaveBeenCalled();
    expect(uploadToS3Spy).toHaveBeenCalled();
    expect(makeApplicationVersionAvailableToBeanstalkSpy).toHaveBeenCalled();
  });
});
