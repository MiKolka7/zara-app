const gulp = require('gulp')
    , sass = require('gulp-sass')
    , csso = require('gulp-csso')
    , gutil = require('gulp-util')
    , merge = require('merge-stream')
    , clean  = require('gulp-clean')
    , concat = require('gulp-concat')
    , notify = require('gulp-notify')
    , rename = require("gulp-rename")
    , uglify = require('gulp-uglify')
    , connect = require('gulp-connect')
    , ghPages = require('gulp-gh-pages')
    , imagemin = require('gulp-imagemin')
    , sourcemaps = require('gulp-sourcemaps')
    , minifyHTML = require('gulp-minify-html')
    , spritesmith = require('gulp.spritesmith')
    , fileinclude = require('gulp-file-include')
    , autoprefixer = require('gulp-autoprefixer')
    , browserSync = require('browser-sync').create()
    ;

gulp.task('server', function() {
    browserSync.init({
        server: {
            baseDir: "./"
        },
        port: "7777"
    });

    gulp.watch(['./**/*.html']).on('change', browserSync.reload);
    gulp.watch('./js/**/*.js').on('change', browserSync.reload);

    gulp.watch('./templates/**/*.html', ['fileinclude']);

    gulp.watch('./sass/**/*', ['sass']);
});

gulp.task('sass', function () {
    gulp.src(['./sass/**/*.scss', './sass/**/*.sass'])
        .pipe(sourcemaps.init())
        .pipe(
            sass({outputStyle: 'expanded'})
            .on('error', gutil.log)
        )
        .on('error', notify.onError())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./css/'))
        .pipe(browserSync.stream());
});

/*
 * вставка шаблонів в pages/*.html
 */
gulp.task('fileinclude', function() {
  gulp.src(['./templates/pages/**/*.html'])
    .pipe(fileinclude({
      prefix: '@@',
      basepath: '@file'
    }).on('error', gutil.log))
    .on('error', notify.onError())
    .pipe(gulp.dest('pages/'))
});

/*
 * стиснення svg, png, jpeg та збереження в папці /public/images/
 */ 
gulp.task('minify:img', function () {
    gulp.src(['./images/**/*', '!./images/sprite/*'])
        .pipe(imagemin().on('error', gutil.log))
        .pipe(gulp.dest('./public/images/'));
});

/*
 * стиснення css та збереження в папці /public/images/
 */ 
gulp.task('minify:css', function () {
    gulp.src('./css/**/*.css')
        .pipe(autoprefixer({
            browsers: ['last 30 versions'],
            cascade: false
        }))
        .pipe(csso())
        .pipe(gulp.dest('./public/css/'));
});

/*
 * стиснення js та збереження в папці /public/js/
 */ 
gulp.task('minify:js', function () {
    gulp.src('./js/**/*.js')
        .pipe(uglify())
        .pipe(gulp.dest('./public/js/'));
});

/*
 * стиснення html та збереження в папці /public/js/pages
 */ 
gulp.task('minify:html', function () {
    var opts = {
        conditionals: true,
        spare: true
    };

    gulp.src(['./index.html'])
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest('./public/'));

    gulp.src(['./pages/**/*.html'])
        .pipe(minifyHTML(opts))
        .pipe(gulp.dest('./public/pages/'));
});

/*
 * видалити файли які утворюються з допомогою білда
 */ 
gulp.task('clean', function() {
    gulp.src([
    	'./public',
    	'./css/style.css',
    	'./pages',
	], { read: false }).pipe(clean());
});

/*
 * збірка спрайта з папки images/sprite/
 * на виході в папці sass є _icon-mixin.scss
 * та sprite.png в папці images/
 */ 
gulp.task('sprite', function () {
    var spriteData = gulp.src('images/sprite/*').pipe(
        spritesmith({
            imgName: 'sprite.png',
            cssName: '_icon-mixin.scss',
            retinaImgName: 'sprite@2x.png',
            retinaSrcFilter: ['images/sprite/*@2x.png'],
            cssVarMap: function (sprite) {
                sprite.name = 'icon-' + sprite.name;
            }
        })
    );

    var imgStream = spriteData.img.pipe(gulp.dest('images/'));
    var cssStream = spriteData.css.pipe(gulp.dest('sass/'));

    merge(imgStream, cssStream);
});

/*
 * публікація проекта (public/*) на gh-pages
 */ 
gulp.task('deploy', function() {
    gulp.src('./public/**/*').pipe(ghPages());
});

gulp.task('default', ['server', 'sass', 'fileinclude']);
gulp.task('production', ['minify:html', 'minify:css', 'minify:js', 'minify:img']);
