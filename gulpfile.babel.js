"use strict";
import gulp from 'gulp';
import mocha from 'gulp-mocha';
import istanbul from 'gulp-istanbul';
import babel from 'gulp-babel';
import del from 'del';
import plumber from 'gulp-plumber';
import eslint from 'gulp-eslint';
import coveralls from 'gulp-coveralls';
import util from 'gulp-util';
import {Instrumenter} from 'isparta';

function registerBabel() {
    require('babel-register');
}

function onError() {
    util.beep();
}

// Lint a set of files
function lint(files) {
    return gulp.src(files)
        .pipe(plumber())
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failOnError())
        .on('error', onError);
}

function lintSrc() {
    return lint('src/**/*.js');
}

function lintTest() {
    return lint('test/**/*.js');
}

function lintGulpfile() {
    return lint('gulpfile.babel.js');
}

function test() {
    registerBabel();
    return gulp.src(['./test/*.spec.js'], {read: false})
        .pipe(mocha({
            reporter: process.env.MOCHA_REPORTER || 'spec',
            globals: ["sinon", "chai", "expect"],
            require: ['./test/test-helper.js']
        }));
}

gulp.task('build', ['lint', 'clean'], () => {
    gulp.src('./src/*')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
});

// Remove the built files
gulp.task('clean', () => {
    del.sync(['dist']);
});

// Lint and run our tests
gulp.task('test', ['lint'], () => {
    registerBabel();
    return test();
});

gulp.task('coverage', ['lint'], (done) => {
    registerBabel();
    gulp.src(['src/**/*.js'])
        .pipe(istanbul({instrumenter: Instrumenter}))
        .pipe(istanbul.hookRequire())
        .on('finish', function () {
            return test()
                .pipe(istanbul.writeReports())
                .on('end', done);
        });
});

gulp.task('coveralls', () => {
    if (!process.env.CI) {
        return;
    }
    gulp.src('./coverage/lcov.info')
        .pipe(coveralls());
});

gulp.task('watch', ['test'], () => {
    gulp.watch(['src/**/*', 'test/**/*'], ['test']);
});

gulp.task('default', ['coverage']);

// Lint our test code
gulp.task('lint-test', lintTest);

// Lint our source code
gulp.task('lint-src', lintSrc);

// Lint this file
gulp.task('lint-gulpfile', lintGulpfile);

gulp.task('lint', ['lint-src', 'lint-test', 'lint-gulpfile']);
