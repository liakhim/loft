// Определяем переменную "preprocessor"
let preprocessor = 'sass';

// Определяем константы Gulp
const { src, dest, parallel, series, watch } = require('gulp');

// Подключаем Browsersync
const browserSync = require('browser-sync').create();
const gulpRigger = require('gulp-rigger')
// Подключаем gulp-concat
const concat = require('gulp-concat');
const fs = require("file-system");
// Подключаем gulp-uglify-es
const uglify = require('gulp-uglify-es').default;

// Подключаем модули gulp-scss и gulp-less
const sass = require('gulp-sass')(require('sass'));
const less = require('gulp-less');

// Подключаем Autoprefixer
const autoprefixer = require('gulp-autoprefixer');

// Подключаем модуль gulp-clean-css
const cleancss = require('gulp-clean-css');

// Определяем логику работы Browsersync
function browsersync() {
    browserSync.init({ // Инициализация Browsersync
        server: { baseDir: './' }, // Указываем папку сервера
        notify: false, // Отключаем уведомления
        online: true // Режим работы: true или false
    })
}

function scripts() {
    return src([ // источники (в тч библиотеки)
        'node_modules/vue/dist/vue.min.js',
        'src/js/main.js',
    ])
        .pipe(concat('app.min.js')) // конкатенируем в один файл
        .pipe(uglify()) // сжимаем
        .pipe(dest('assets/js/')) // выгружаем
        .pipe(browserSync.stream()) // перезвгружаем
}

function styles() {
    return src('src/scss/main.scss') // источник
        .pipe(eval(preprocessor)()) // преобразуем значение переменной "preprocessor" в функцию
        .pipe(concat('app.min.css')) // конкатенируем в файл app.min.js
        .pipe(autoprefixer({ overrideBrowserslist: ['last 10 versions'], grid: true })) // префиксы
        .pipe(cleancss( { level: { 1: { specialComments: 0 } }/* , format: 'beautify' */ } ))
        .pipe(dest('assets/css/')) // папка выгрузки
        .pipe(browserSync.stream()) // перезагружаем
}

function html () {
    // пока доступна только одна вложенность (больше не требуется)
    // если нужно - переделать на рекурсию
    // получаем всё что внутри папки
    const childs = fs.readdirSync('src/pages/');
    childs.forEach(item => {
        // проверяем папка это или файл html
        if (item.split('.').length > 1 && item.split('.')[item.split('.').length - 1] === 'html') {
            src('src/pages/' + item) // источник
                .pipe(gulpRigger()) // прогоняем через rigger
                .pipe(dest('./')) // вгружаем
        } else {
            // получаем всё что внутри вложенной папки
            const folderChilds = fs.readdirSync('src/pages/' + item + '/');
            folderChilds.forEach(it => {
                src('src/pages/' + item + '/' + it) // источник
                    .pipe(gulpRigger()) // прогоняем через rigger
                    .pipe(dest(item + '/')) // выгружаем
            })
        }
    })
    browserSync.reload()
}

function startwatch() {

    // Выбираем все файлы JS в проекте, а затем исключим с суффиксом .min.js
    watch(['src/**/*.js', '!app/**/*.min.js'], scripts);
    watch(['src/**/*.js', '!app/**/*.min.js']).on('change', browserSync.reload);

    // Мониторим файлы препроцессора на изменения
    watch('src/scss/**/*', styles);
    watch('src/scss/**/*').on('change', browserSync.reload);

    // Мониторим файлы HTML на изменения
    watch('src/pages/*').on('change', html);
    watch('src/pages/*.html').on('change', browserSync.reload);
}

// Экспортируем функции
exports.browsersync = browsersync;
exports.scripts = scripts;
exports.styles = styles;
exports.html = html;

// Создаём новый таск "build", который последовательно выполняет нужные операции
exports.test = series(html);
exports.build = series(styles, html, scripts);

// Экспортируем дефолтный таск с нужным набором функций
exports.default = parallel(styles, html, scripts, browsersync, startwatch);
