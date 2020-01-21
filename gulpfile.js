var gulp = require('gulp');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var cssmin = require('gulp-css');
var rename = require('gulp-rename');

gulp.task('sass', function() {
	gulp.src([
		'assets/src/scss/main.scss'
	])
	.pipe(sass().on('error', sass.logError))
	.pipe(gulp.dest('assets/src/css'))
});

gulp.task('css', ['sass'], function() {
	setTimeout(function(){
		gulp.src([
			'assets/src/css/fontawesome-all.css',
			'assets/src/css/owl.carousel.css',
			'assets/src/css/bootstrap-select.css',
			'assets/src/css/popper.css',
			'assets/src/css/jquery-ui-slider.css',
			'assets/src/css/swipebox.css',
			'assets/src/css/main.css'
		])
		.pipe(concat('app.css'))
		.pipe(rename({suffix:'.min'}))
		.pipe(cssmin())
		.pipe(gulp.dest('assets/dist/css'))
	}, 200)
});

gulp.task('js', function() {
	setTimeout(function(){
		gulp.src([
			// 'assets/src/js/typed.js',
			// 'assets/src/js/isotope.pkgd.js',
			// 'assets/src/js/packery-mode.pkgd.js',
			'assets/src/js/jquery.swipebox.js',
			'assets/src/js/bootstrap-select.js',
			'assets/src/js/imagesloaded.pkgd.js',
			'assets/src/js/owl.carousel.js',
			'assets/src/js/born-dropdown.js',
			'assets/src/js/main.js'
		])
		.pipe(concat('app.js'))
		.pipe(rename({suffix:'.min'}))
		.pipe(uglify())
		.pipe(gulp.dest('assets/dist/js/'))
	}, 200)
});

gulp.task('default', ['sass', 'css', 'js']);

gulp.task('watch', function() {
	gulp.watch('assets/src/scss/**/*.scss', ['css'])
	gulp.watch('assets/src/js/*.js', ['js'])
});