import Application from '../src/application';

describe('Application', () => {
  it('it should stop if failed to upload archive', async () => {
    const mockCredentials = {
      region: 'ap-southeast-2',
      credentials: {
        accessKeyId: 'FAKE_ACCESS_KEY',
        secretAccessKey: 'FAKE_SECRET_KEY',
      },
    };

    const application: any = new Application(mockCredentials);

    application.archive = {
      upload: async () => {
        throw new Error('Failed to upload archive');
      },
    };

    await expect(application.deploy({})).rejects.toThrow(
      'Failed to upload archive',
    );
  });
});
