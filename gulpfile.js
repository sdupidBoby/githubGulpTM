var gulp = require('gulp');
/*引入gulp及相关插件 require('node_modules里对应模块')*/
// css
var stylus = require('gulp-stylus');              //编译stylus
var cleanCss = require('gulp-clean-css');        // 压缩css
var autoprefixer = require('gulp-autoprefixer');// css前缀
var uglify = require('gulp-uglify');    //压缩JS
var htmlmin = require('gulp-htmlmin'); //压缩html

var rev = require('gulp-rev');	                   // 给文件加入版本号
var revCollector = require('gulp-rev-collector'); // 替换html中的文件名
var concat = require('gulp-concat');             // 合并
var browserSync = require('browser-sync').create();      // 浏览器运行
var clean = require('gulp-clean');             //清空文件夹，避免文件冗余
var runSequence = require('run-sequence');    //执行顺序，避免

const imagemin = require('gulp-imagemin');  // 压缩图片
const pngquant = require('imagemin-pngquant');

var del = require('del');  // 下面两个就是在管道中 进行文件删除操作
var vinylPaths = require('vinyl-paths');

const SRC = './src/'
const SRC_JS = SRC + 'js'
const SRC_CSS = SRC + 'css'
const SRC_IMG = SRC + 'img'
const SRC_STYLUS = SRC + 'stylus'

const SRC_JS_ALL = SRC_JS + '/**/*'
const SRC_CSS_ALL = SRC_CSS + '/**/*'
const SRC_IMG_ALL = SRC_IMG + '/*.{png,jpg,gif,ico}'
const SRC_HTML_ALL = SRC + '*.html'
const SRC_STYLUS_ALL = SRC_STYLUS + '/**/*.styl'

const DIST = './dist/'
const DIST_JS = DIST + 'js'
const DIST_CSS = DIST + 'css'
const DIST_IMG = DIST + 'img'
const DIST_JS_ALL = DIST_JS + '/**/*'
const DIST_CSS_ALL = DIST_CSS + '/**/*'
const DIST_IMG_ALL = DIST_IMG + '/**/*'
const DIST_HTML_ALL = DIST + '*.html'


// ======================================================css
gulp.task('compile-stylus', function() {
    return  gulp.src(SRC_STYLUS_ALL)
            .pipe(stylus({
                compress: false
            }))
            .pipe(autoprefixer({   // 支持到IE9
                browsers: 'last 3 versions' 
            }))
            .pipe(gulp.dest(SRC_CSS))
});
gulp.task('compile-css',['compile-stylus'], function() {
    return  gulp.src(SRC_CSS_ALL)
            // .pipe(concat('xmtcss.min.css'))
            .pipe(cleanCss())
            .pipe(gulp.dest(DIST_CSS))
});

// ======================================================js
gulp.task('js-optimize', function(cb) {
    return gulp.src(SRC_JS_ALL)
        // .pipe(concat('xmtcss.min.js'))
        .pipe(uglify())
        .pipe(gulp.dest(DIST_JS));
});

// ======================================================html
gulp.task('html-optimize', function(cb) {
    var options = {
        removeComments: true, //清除HTML注释
        collapseWhitespace: true, //压缩HTML
        // collapseBooleanAttributes: true,//省略布尔属性的值 <input checked="true"/> ==> <input />
        removeEmptyAttributes: true,//删除所有空格作属性值 <input id="" /> ==> <input />
        // removeScriptTypeAttributes: true,//删除<script>的type="text/javascript"
        // removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type="text/css"
        minifyJS: true, //压缩页面JS
        minifyCSS: true //压缩页面CSS
      };
    return  gulp.src(SRC_HTML_ALL)
            .pipe(htmlmin(options))
            .pipe(gulp.dest(DIST));
});

// ======================================================   watcher
gulp.task('watcher',['clean','compile-css','js-optimize','html-optimize'], function() {
    console.log('正在监视 .........');
    browserSync.init({
        server: {
            baseDir: './dist',
            index: '/index.html'
        }
    })
    // 监视那些文件的变动，以及变动之后执行的任务
    gulp.watch(SRC_STYLUS_ALL, ['compile-css']).on('change', browserSync.reload)
    var watcherHTML = gulp.watch(SRC_HTML_ALL, ['html-optimize']).on('change', browserSync.reload)
    var watcherJS   = gulp.watch(SRC_JS_ALL, ['js-optimize']).on('change', browserSync.reload)

    // watcherCSS.on('change', function(event) {
    //     browserSync.reload;
    //     // 在 CLI 中输出一些提示信息，帮助我们了解程序发生了什么
    //     console.log(event.path + '......' + event.type + '......css');
    // });
});


// ======================================================下面是独立的功能 clean-all-dist
/*清空文件夹*/
gulp.task('clean-alldist',function(){
	return  gulp.src([DIST_CSS_ALL,DIST_IMG_ALL,DIST_JS_ALL,DIST_HTML_ALL,'./json/**/*.json'],{read: false})
		    .pipe(clean());
});

// ======================================================下面是独立的功能 MD文件名（js.css）
/*清空文件夹*/
gulp.task('clean',function(){
	return  gulp.src([DIST_CSS_ALL,DIST_JS_ALL,DIST_HTML_ALL,'./json/**/*.json'],{read: false})
		    .pipe(clean());
});

/*add dev*/
gulp.task('rev-css',function(){
    return gulp.src(DIST_CSS_ALL)  
        .pipe(vinylPaths(del)) //先删除源文件 在进行hash：css
        .pipe(rev())  //文件加入版本号
        .pipe(gulp.dest(DIST_CSS))
		.pipe(rev.manifest())  //对应的版本号和原始文件用json表示出来
		.pipe(gulp.dest('./json/css'));
});
gulp.task('rev-js',function(){
    return gulp.src(DIST_JS_ALL)
        .pipe(vinylPaths(del)) //先删除源文件 在进行hash：js
        .pipe(rev())  //文件加入版本号
        .pipe(gulp.dest(DIST_JS))
		.pipe(rev.manifest())  //对应的版本号和原始文件用json表示出来
		.pipe(gulp.dest('./json/js'));
});

gulp.task('dev',function(){
	return gulp.src(['json/**/*.json',DIST_HTML_ALL])
		.pipe(revCollector({
			 replaceReved: true
		}))
		.pipe(gulp.dest(DIST));
});

gulp.task('hash',function(){
	runSequence(
        'clean',
        'compile-css',
        'js-optimize',
        'html-optimize',
        'rev-css',
        'rev-js',
		'dev'
	);
});

// ======================================================下面是独立的功能 压缩图片
gulp.task('min-img', () =>
    gulp.src(SRC_IMG_ALL)
        .pipe(imagemin({ 
          svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
          optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
          progressive: true,  //类型：Boolean 默认：false 无损压缩jpg图片
          interlaced: true,  //类型：Boolean 默认：false 隔行扫描gif进行渲染
          multipass: true, //类型：Boolean 默认：false 多次优化svg直到完全优化
          use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
        }))
        .pipe(gulp.dest(DIST_IMG))
);






