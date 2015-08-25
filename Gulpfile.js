"use strict";
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var istanbul = require('gulp-istanbul');
var eslint = require('gulp-eslint');
var coveralls = require('gulp-coveralls');

gulp.task('test', function () {

    gulp.src('./lib/*')
        .pipe(istanbul({includeUntested: true}))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            gulp.src('./test/*.spec.js', {read: false})
                .pipe(plumber())
                .pipe(mocha({
                    reporter: process.env.MOCHA_REPORTER || 'spec',
                    require: ['./test/test-helper.js']
                }))
                .pipe(istanbul.writeReports());
        });
});

gulp.task('lint', function () {

    return gulp.src(['lib/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

gulp.task('coveralls', function () {
    if (!process.env.CI) {
        return;
    }
    gulp.src('./coverage/lcov.info')
        .pipe(coveralls());
});
