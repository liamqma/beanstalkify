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

gulp.task('lint-src', lintSrc);

// Remove the built files
gulp.task('clean', (done) => {
    del.sync(['dist']);
    done();
});

// Lint our test code
gulp.task('lint-test', lintTest);

// Lint our source code

// Lint this file
gulp.task('lint-gulpfile', lintGulpfile);

gulp.task('lint', gulp.series('lint-src', 'lint-test', 'lint-gulpfile'));

gulp.task('build', gulp.series('lint', 'clean', (done) => {
    gulp.src('./src/*')
        .pipe(babel())
        .pipe(gulp.dest('dist'));
    done();
}));

