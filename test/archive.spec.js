import Archive from '../src/archive';
import path from 'path';
import q from 'q';
const filePath = path.join(__dirname, '/fixture/app-name-version.zip');

describe('Archive', function () {

    describe('constructor', () => {
        it('should should parse file name', () => {

            var archive = new Archive(filePath);
            expect(archive.archiveName).to.equal('app-name-version.zip');
            expect(archive.version).to.equal('version');
            expect(archive.appName).to.equal('app-name');

        });
    });

    describe('upload', () => {
        it('should should trigger doUpload() if not already uploaded', (done) => {
            var archive = new Archive(filePath);
            archive.doUpload = sinon.spy();
            archive.alreadyUploaded = () => {
                return q(false);
            };
            archive.upload().then(() => {
                expect(archive.doUpload).to.have.been.called;
                done();
            });
        });
    });

});
