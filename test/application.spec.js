import test from 'ava';
import 'babel-core/register';
import Application from '../src/application';

test('it should stop if failed to upload archive', t => {
    const application = new Application();
    application.archive = {
        upload: () => {
            throw new Error();
        }
    };
    t.throws(application.deploy({}));
});
