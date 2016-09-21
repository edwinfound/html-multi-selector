var gulp = require('gulp');
var gulpPrint = require('gulp-print');
var gulpUglify = require('gulp-uglify');
var gulpCleanCss = require('gulp-clean-css');
var gulpLess = require('gulp-less');

gulp.task('buildJs', function () {
    return gulp.src('src/**/*.js')
        .pipe(gulpPrint(function (path) {
            return "build: " + path;
        }))
        .pipe(gulpUglify())
        .pipe(gulp.dest('dist'));
});


gulp.task('buildLess', function () {
    return gulp.src('src/**/*.less')
        .pipe(gulpPrint(function (path) {
            return "build: " + path;
        }))
        .pipe(gulpLess())
        .pipe(gulpCleanCss({keepSpecialComments: 0}))
        .pipe(gulp.dest('dist'));
});


gulp.task('default', ['buildJs', 'buildLess'], function () {

});