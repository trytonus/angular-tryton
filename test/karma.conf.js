// Karma configuration
// Generated on Thu May 22 2014 18:35:58 GMT+0530 (IST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '..',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'closure'],


    // list of files / patterns to load in the browser
    files: [
      'bower_components/google-closure-library/closure/goog/base.js',
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'bower_components/ngstorage/ngStorage.min.js',
      'test/**/*.js',
      'src/*.js',
      {
        pattern: 'bower_components/google-closure-library/closure/goog/deps.js',
        included: false,
        served: false
      }, {
        pattern: 'bower_components/google-closure-library/closure/goog/**/*.js',
        included: false
      }
    ],


    // list of files to exclude
    exclude: [
      
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/**/*.js': ['closure', 'closure-iit'],
      'src/*.js': ['closure', 'coverage'],
      'bower_components/google-closure-library/closure/goog/**/*.js': ['closure'],
      'bower_components/google-closure-library/closure/goog/deps.js': ['closure-deps']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    // Coverage report
    coverageReporter: {
      reporters:[
        {type: 'html', dir:'coverage/'},
        {type: 'text-summary'}
      ]
    },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
