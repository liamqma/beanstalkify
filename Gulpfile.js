"use strict";
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var eslint = require('gulp-eslint');

gulp.task('test', function () {
    return gulp.src(['./test/*.spec.js'], {
        read: false
    }).pipe(plumber()).pipe(mocha({
        reporter: process.env.MOCHA_REPORTER || 'nyan',
        require: ['./test/test-helper.js']
    }));
});

gulp.task('lint', function() {

    return gulp.src(['lib/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});