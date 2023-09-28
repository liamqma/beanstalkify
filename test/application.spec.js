import test from 'ava';
import 'babel-core/register';
import Application from '../src/application';

test('it should stop if failed to upload archive', async t => {
    // Mock the credentials
    const mockCredentials = {
        region: 'ap-southeast-2',
        credentials: {
            accessKeyId: 'FAKE_ACCESS_KEY',
            secretAccessKey: 'FAKE_SECRET_KEY'
        }
    };

    const application = new Application(mockCredentials);

    application.archive = {
        upload: async () => {
            throw new Error('Failed to upload archive');
        }
    };

    try {
        await application.deploy({});
        t.fail('Expected an error to be thrown');
    } catch (error) {
        t.is(error.message, 'Failed to upload archive');
    }
});
