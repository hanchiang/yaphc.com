import gulp from 'gulp';
import {spawn} from 'child_process';
import hugoBin from 'hugo-bin';
import log from 'fancy-log';
import pluginError from 'plugin-error';
import flatten from 'gulp-flatten';
import postcss from 'gulp-postcss';
import cssImport from 'postcss-import';
import cssnext from 'postcss-cssnext';
import cleanCSS from 'gulp-clean-css';
import concatCSS from 'gulp-concat-css';
import BrowserSync from 'browser-sync';
import webpack from 'webpack';
import webpackConfig from './webpack.conf';
import swPrecache  from 'sw-precache';

const browserSync = BrowserSync.create();

// Hugo arguments
const hugoArgsDefault = ['-d', '../dist', '-s', 'site', '-v'];
const hugoArgsPreview = ['--buildDrafts', '--buildFuture'];

// Development tasks
gulp.task('hugo', (cb) => buildSite(cb));
gulp.task('hugo-preview', (cb) => buildSite(cb, hugoArgsPreview));

// Run server tasks
gulp.task('server', ['hugo', 'css', 'js', 'fonts', 'sw'], (cb) => runServer(cb));
gulp.task('server-preview', ['hugo-preview', 'css', 'js', 'fonts'], (cb) => runServer(cb));

// Build/production tasks
gulp.task('build', ['css', 'js', 'fonts', 'sw'], (cb) => buildSite(cb, [], 'production'));
gulp.task('build-preview', ['css', 'js', 'fonts'], (cb) => buildSite(cb, hugoArgsPreview, 'production'));

// Compile CSS with PostCSS
gulp.task('css', () => {
  gulp.src(['./site/themes/casper-two/static/css/*.css', '.site/static/css/*.css'])
    // .pipe(postcss([cssImport({from: './src/css/main.css'}), cssnext()]))
    .pipe(postcss([cssnext()]))
    .pipe(concatCSS('styles.min.css'))
    .pipe(cleanCSS({ compatibility: 'ie8' }))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream())
});

// Compile Javascript
gulp.task('js', (cb) => {
  const myConfig = Object.assign({}, webpackConfig);

  webpack(myConfig, (err, stats) => {
    if (err) throw new pluginError('webpack', err);
    log(`[webpack] ${stats.toString({
      colors: true,
      progress: true
    })}`);
    browserSync.reload();
    cb();
  });
});

// Move all fonts in a flattened directory
gulp.task('fonts', () => (
  gulp.src('./src/fonts/**/*')
    .pipe(flatten())
    .pipe(gulp.dest('./dist/fonts'))
    .pipe(browserSync.stream())
));

// Generate service worker
gulp.task('sw', (cb) => {
  const rootDir = 'dist';

  swPrecache.write(`${rootDir}/sw.js`, {
    staticFileGlobs: [rootDir + '/**/*.{js,html,css,png,jpg,gif,svg,eot,ttf,woff}'],
    stripPrefix: rootDir
  }, cb)
});

// Development server with browsersync
function runServer() {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  });
  gulp.watch('./src/js/**/*.js', ['js']);
  gulp.watch('./src/css/**/*.css', ['css']);
  gulp.watch('./src/fonts/**/*', ['fonts']);
  gulp.watch('./site/**/*', ['hugo']);
};

/**
 * Run hugo and build the site
 */
function buildSite(cb, options, environment = 'development') {
  const args = options ? hugoArgsDefault.concat(options) : hugoArgsDefault;

  process.env.NODE_ENV = environment;

  return spawn(hugoBin, args, {stdio: 'inherit'}).on('close', (code) => {
    if (code === 0) {
      browserSync.reload();
      cb();
    } else {
      browserSync.notify('Hugo build failed :(');
      cb('Hugo build failed');
    }
  });
}
