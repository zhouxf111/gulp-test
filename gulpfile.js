const { src, dest, series, parallel, watch } = require('gulp');
const del = require('del');
const htmlmin = require('gulp-htmlmin'); // 压缩html
const babel = require('gulp-babel'); // 编译es6
const uglify = require('gulp-uglify'); // 压缩丑化js
const cleanCSS = require('gulp-clean-css'); // 压缩css
const sass = require('gulp-sass'); // 编译sass
const imgmin = require('gulp-tinypng-nokey'); // 图片压缩
const rev = require('gulp-rev'); // 对文件名加MD5后缀
const revCollector = require('gulp-rev-collector'); // 替换被gulp-rev改名的文件名
const browserSync = require('browser-sync').create(); // 自动刷新文件
// const watch = require('gulp-watch'); //监听文件

const clean = function(cb) {
  // return del(['./dist/', '!./dist/images/']); // 问题：不排除images文件下的图片
  return del(['./dist/{js/*, css/*, rev-css/*, rev-js/*, *}']);
};
const cleanJs = function() {
  return del('./dist/js/*');
};
const cleanCss = function() {
  return del('./dist/css/*');
};
const cleanImage = function() {
  return del('./dist/images/*');
};

/**
 * 压缩js文件
 */
const js = function() {
  return src(['./src/js/**/*'])
    // 把src下面的文件经过babel转义
    .pipe(babel({ presets: ['@babel/env']}))
    // js压缩
    .pipe(uglify())
    .pipe(browserSync.reload({stream: true})) // 实时刷新
    // 把源文件移动到dist下
    .pipe(rev()) // 给文件加hash编码
    .pipe(dest('./dist/js'))
    .pipe(rev.manifest()) // 生成一个rev-manifest.json 快照，记录MD5的文件改名前后的对应
    .pipe(dest('./dist/rev-js'));
};

/**
 * 压缩css
 * @param {*} cb
 */
const css = function() {
  return src('./src/css/**/*')
    .pipe(sass()) // 编译sass
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(rev()) // 给文件加hash编码
    .pipe(browserSync.reload({stream: true})) // 实时刷新
    .pipe(dest('./dist/css'))
    .pipe(rev.manifest()) // 生成一个rev-manifest.json 快照，记录MD5的文件改名前后的对应
    .pipe(dest('./dist/rev-css'));
};

/**
 * 压缩HTML
 */
const html = function() {
  let options = {  
    removeComments: true, //清除HTML注释  
    collapseWhitespace: true, //压缩HTML  
    removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"  
    removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
    minifyJS: true, //压缩页面JS
    minifyCSS: true //压缩页面CSS
  };  
  return src('./src/**/*.html')
    .pipe(htmlmin(options))
    .pipe(browserSync.reload({stream: true})) // 实时刷新
    .pipe(dest('./dist/'));
};

const img = function() {
  return src('./src/images/*')
  .pipe(imgmin()) // 图片压缩
  .pipe(browserSync.reload({stream: true})) // 实时刷新
  .pipe(dest('./dist/images/'));
};

/**
 *  修改html中被gulp-rev改名的文件名
 */
const revTask = function() {
  return src(['./dist/**/*.json', './dist/**/*.html'])
    .pipe(revCollector()) // 替换html中对应的记录
    .pipe(dest('./dist/'))
    .pipe(browserSync.reload({stream: true})); // 实时刷新
};

const devServer = function(cb) {
  browserSync.init({
    server: {
      baseDir: './dist',
      index: 'index.html'
    },
    port: 8080,
    open: 'external',
    injectChanges: true
  });

  // watch('./src/**/*.html', series(html));
  // watch('./dist/**/*.html', revTask);
  watch('./src/**/*.html', series(html, revTask));
  watch('./src/js/*', series(cleanJs, js));
  watch('./src/css/*', series(cleanCss, css));
  watch('./src/images/*', series(cleanImage, img));
  watch('./dist/**/*.json', series(html, revTask));
  cb();
};

exports.default = series(clean, parallel(js, css, html), devServer, revTask);
exports.img = img;