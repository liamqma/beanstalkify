"use strict";
var gulp = require('gulp');
var mocha = require('gulp-mocha');
var plumber = require('gulp-plumber');
var eslint = require('gulp-eslint');
var babel = require('gulp-babel');

gulp.task('babel', function() {
    return gulp.src('src/*.js')
        .pipe(babel())
        .pipe(gulp.dest('dist/'));
});

gulp.task('test', function () {
    return gulp.src(['./test/*.spec.js'])
        .pipe(plumber())
        .pipe(mocha({
            reporter: process.env.MOCHA_REPORTER || 'spec',
            require: ['./test/test-helper.js']
        }));
});

gulp.task('lint', function () {
    return gulp.src(['lib/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError());
});

// Default Task
gulp.task('default', ['lint', 'babel', 'test']);