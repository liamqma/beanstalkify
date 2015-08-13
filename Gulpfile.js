var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');

gulp.task('test', function () {
    return gulp.src(['./test/*.spec.js'], {
        read: false
    }).pipe(plumber()).pipe(mocha({
        reporter: process.env.MOCHA_REPORTER || 'nyan',
        require: ['./test/test-helper.js']
    }));
});

