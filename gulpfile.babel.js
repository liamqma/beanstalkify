"use strict";
import gulp from 'gulp';
import mocha from 'gulp-mocha';
import istanbul from 'gulp-istanbul';
import babel from 'gulp-babel';
import del from 'del';
import path from 'path';
import plumber from 'gulp-plumber';
import eslint from 'gulp-eslint';
import {Instrumenter} from 'isparta'

// Remove the built files
gulp.task('clean', () => {
    del.sync(['dist']);
});

function createLintTask(taskName, files) {
    gulp.task(taskName, function () {
        return gulp.src(files)
            .pipe(plumber())
            .pipe(eslint())
            .pipe(eslint.format())
            .pipe(eslint.failOnError())
    });
};

// Lint our source code
createLintTask('lint-src', ['src/**/*.js']);

// Lint our test code
createLintTask('lint-test', ['test/**/*.js']);

gulp.task('build', ['lint-src', 'clean'], () => {
    gulp.src('./src/*')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
});

function test() {
    return gulp.src(['./test/*.spec.js'], {read: false})
        .pipe(mocha({
            reporter: process.env.MOCHA_REPORTER || 'spec',
            globals: ["sinon", "chai", "expect"],
            require: ['./test/test-helper.js']
        }));
}

// Lint and run our tests
gulp.task('test', ['lint'], () => {
    require('babel-core/register');
    return test();
});

gulp.task('coverage', ['lint'], (done) => {
    require('babel-core/register');
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

gulp.task('default', ['test']);
gulp.task('lint', ['lint-src', 'lint-test']);
