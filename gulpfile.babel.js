"use strict";
import gulp from 'gulp';
import babel from 'gulp-babel';
import del from 'del';
import plumber from 'gulp-plumber';
import eslint from 'gulp-eslint';
import util from 'gulp-util';

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

gulp.task('build', ['lint', 'clean'], () => {
    gulp.src('./src/*')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
});

// Remove the built files
gulp.task('clean', () => {
    del.sync(['dist']);
});

// Lint our test code
gulp.task('lint-test', lintTest);

// Lint our source code
gulp.task('lint-src', lintSrc);

// Lint this file
gulp.task('lint-gulpfile', lintGulpfile);

gulp.task('lint', ['lint-src', 'lint-test', 'lint-gulpfile']);
