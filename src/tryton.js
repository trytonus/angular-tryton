goog.provide('ng.tryton');

goog.require('ng.tryton.fulfil');
goog.require('ng.tryton.PYSON');
goog.require('goog.crypt.base64');


goog.scope(function() {
  'use strict';

  var Fulfil = ng.tryton.fulfil;
  var PYSON = ng.tryton.PYSON;

  /**
   * @ngdoc overview
   * @name fulfil.angular-tryton
   * @description
   * An [AngularJS](https://github.com/angular/angular.js) module that makes
   * tryton JSONRPC working in the *Angular Way*. Contains two services `tryton`,
   * `session` and one filter `urlTryton`.
   *
   *  Install
   * =======
   *
   * ```bash
   * bower install angular-tryton
   * ```
   *
   * Usage
   * =====
   *
   * ### Require `fulfil.angular-tryton` and Inject the Services
   *
   * ```js
   * angular.module('app', [
   *     'fulfil.angular-tryton'
   * ]).controller('Ctrl', function(
   *   $scope,
   *   tryton,
   *   session
   * ){});
   * ```
   *
   *
   * How to contribute
   * -----------------
   *
   * If you're still convinced that angular-tryton needs to be modified in order to handle your problem and you have an idea on how to do that, well here's how to turn that idea into a commit (or two) in easy steps:
   *
   * 1. [Fork Angular Tryton](http://github.com/openlabs/angular-tryton) into your very own GitHub repository
   *
   * 2. Install git pre-commit hook `cp .hooks/pre-commit.sh .git/hooks/pre-commit`
   *
   * 3. Modify code as required.
   *
   * 2. Once you're satisfied with the changes and you want the rest of the Angular Tryton developers to take a look at them, push your changes back to your own repository and send us a Pull request to develop branch. Don't forget to add test with minimum 100% test coverage.

  **/

  var angularTryton = ng.tryton;

  angularTryton.module = angular.module('fulfil.angular-tryton', ['ngStorage'])
  .config(['$httpProvider', 'sessionProvider', function($httpProvider, sessionProvider) {
    // Intercept all responses and check if the response received has an error
    // property which tryton uses to send errors the server handled.
    var trytonResponseInterceptor = ['$q', '$rootScope', function($q, $rootScope) {
      function success(response) {
        if (response.data && response.data.__error__) {
          // Handle the cases where the response is an error.
          // The __error__ attribute is set by the response Transformer
          var error = angular.copy(response.data);

          if (error instanceof Array) {
            const [type, [message, description]] = error;

            error = {
              type,
              message,
              description,
            };
          }

          const { type, code } = error;

          if (
            type.startsWith('401') ||
            type.startsWith('403') ||
            code === 'H403' ||
            code === 'H401'
          ) {
            /**
             * @ngdoc event
             * @name tryton:Unauthorized
             * @eventOf fulfil.angular-tryton.service:tryton
             * @eventType broadcast on root scope
             *
             * @description
             *
             *  **tryton:Unauthorized**
             *
             *  HTTP: 401: Unauthorized
             *  HTTP: 403: Session is expired and user is not allowed to access.
             *
             *  Raised when the current session token is expired or invalid.
             *  Depending on the application, it could decide to logoff the user
             *  or show a lock screen and ask for the password again to refresh
             *  the login by calling `session.doLogin`.
             *
             *  Example:
             *
             *  ```js
             *  $rootScope.$on('tryton:Unauthorized', function(){
             *    // do something
             *  })
             *  ```
             *
             */
            $rootScope.$broadcast('tryton:Unauthorized');
          } else if (type == 'UserError') {
            /**
             * @ngdoc event
             * @name tryton:UserError
             * @eventOf fulfil.angular-tryton.service:tryton
             * @eventType broadcast on root scope
             *
             * @description
             *
             *  **tryton:UserError**
             *
             *  Raised when an error occurs on processing the request and tryton
             *  handled it. UserErrors are usually known exception like invalid
             *  data or not meeting the requirements.
             *
             *  Example:
             *
             *  ```js
             *  $rootScope.$on('tryton:UserError', function(message, description){
             *    // do something
             *  })
             *  ```
             *
             */
            $rootScope.$broadcast('tryton:UserError', error);
          } else if (type == 'UserWarning') {
            /**
             * @ngdoc event
             * @name tryton:UserWarning
             * @eventOf fulfil.angular-tryton.service:tryton
             * @eventType broadcast on root scope
             *
             * @description
             *
             *  **tryton:UserWarning**
             *
             *  Raised when a warning message needs to be showed to the user.
             *  The `name` can be used to suppress this warning from being shown
             *  in the future. This should be handled by the application logic
             *  and ng-tryton will not handle it.
             *
             *  Example:
             *
             *  ```js
             *  $rootScope.$on('tryton:UserWarning', function(name, message, description){
             *    // do something
             *  })
             *  ```
             *
             */
            $rootScope.$broadcast('tryton:UserWarning', error);
          } else if (type == 'ConcurrencyException') {
            /**
             * @ngdoc event
             * @name tryton:ConcurrencyException
             * @eventOf fulfil.angular-tryton.service:tryton
             * @eventType broadcast on root scope
             *
             * @description
             *
             *  **tryton:ConcurrencyException**
             *
             *  Exception raised when there is a concurrency exception reported
             *  by the optimistic lock. Your application depending on how complex
             *  you want it to be could decide to handle this and ask the user
             *  to compare or confirm the overwrite. This exception is usually
             *  seen when some other user has already updated the record after it
             *  was loaded by the current user (based on timestamp).
             *
             *  Example:
             *
             *  ```js
             *  $rootScope.$on('tryton:ConcurrencyException', function(error){
             *    // do something
             *  })
             *  ```
             *
             */
            $rootScope.$broadcast('tryton:ConcurrencyException', error);
          } else {
            /**
             * @ngdoc event
             * @name tryton:Exception
             * @eventOf fulfil.angular-tryton.service:tryton
             * @eventType broadcast on root scope
             *
             * @description
             *
             *  **tryton:Exception**
             *
             *  An exception that was not one of the handled types. Usually an
             *  error model and a stack trace are returned. which is passed as
             *  such in the broadcast.
             *
             *  Example:
             *
             *  ```js
             *  $rootScope.$on('tryton:Exception', function(error){
             *    // do something
             *  })
             *  ```
             *
             */
            $rootScope.$broadcast('tryton:Exception', error);
          }
          // Finally reject the promise with the response itself
          return $q.reject(response);
        } else {
          return response || $q.when(response);
        }
      }
      function error(response) {
        // TODO: Handle all cases of HTTP error here.
        // and create the necessary signals
        return $q.reject(response);
      }
      return {
        response: success,
        responseError: error
      };
    }];
    $httpProvider.interceptors.push(trytonResponseInterceptor);

    // Transform the return value by sending the result instead of the ID and
    // result object
    var trytonResponseTransformer = function(response, headerGetter) {
      if (response && response.hasOwnProperty('result')) {
        return Fulfil.transformResponse(response.result);
      } else if (response && response.hasOwnProperty('error')) {
        var error = response.error;
        error['__error__'] = true;
        return error;
      }
      return response;
    };
    // This identifier can be used to insert other transformers before this
    trytonResponseTransformer.identifier = "trytonResponseTransformer";
    $httpProvider.defaults.transformResponse.push(trytonResponseTransformer);
  }])


  /**
   * @ngdoc service
   * @name fulfil.angular-tryton.service:tryton
   *
   * @description
   * Low level service to invoke RPC on a tryton server.
   *
   * While this method exposes the implementation of the RPC client, this is
   * required only when you have to call a common service (eg. getting server
   * version) or authenticating. The `rpc` method takes parameters which should
   * include the user ID and session.
   *
   * The `session` service provides a higher level abstraction which offers an
   * RPC client that automatically handles authentication and context for you.
   *
   */
  .service('tryton', ['$http', '$rootScope', '$q', '$localStorage', function ($http, $rootScope, $q, $localStorage) {
    var tryton = this;

    /**
      @ngdoc property
      @name serverUrl
      @propertyOf fulfil.angular-tryton.service:tryton

      @description
        Stores the URL of the RPC server to which the connection has to be
        made.
    **/
    this.serverUrl = $localStorage.serverUrl || '/';

    this.setServerUrl = function(url) {
      tryton.serverUrl = $localStorage.serverUrl = url + (url.slice(-1)==='/' ? '' : '/');
    };

    /**
      @ngdoc method
      @name rpc
      @methodOf fulfil.angular-tryton.service:tryton

      @description
        The lowest level RPC client which invokes the `method` with the
        provided `params` and optionally a database.

      @param {string} method An RPC method that need to be called.
      @param {array} params Parameters to be passed to the `method` including the
                            user ID and session key. If you are looking for this
                            to be automatically handled, look at `session.rpc`
                            instead.
      @param {string} [database=""] Tryton database on which this request need to
                                    be processed. Leave empty for calls that do
                                    not need a database (Ex. getVersion).
      @returns {Promise}  Promise that will be resolved when the success response
                          come from server.

      @example
        <example module="example">
          <file name="index.html">
           <div ng-controller="TrytonCtrl">
             <span ng-init="getServerVersion()">
               Server Version: {{ serverVersion }}
             </span>
           </div>
          </file>
          <file name="app.js">
            angular.module('example', [
              'fulfil.angular-tryton'
            ])
            .controller('TrytonCtrl', [
              '$scope',
              'tryton',
              function ($scope, tryton) {
                tryton.serverUrl = '/';
                $scope.getServerVersion = function () {
                  // Call Tryton JsonRPC server and return promise.
                  tryton.rpc('common.version', [null, null])
                    .success(function (result) {
                      // Do something with result
                      $scope.serverVersion = result;
                    });
                }
              }
            ]);
          </file>
        </example>
    **/
    this.rpc = function(method, params, database, session) {
      // XXX: This can not be done angular http.transformRequest
      // as that method is called after serializing request data.
      var _params = Fulfil.transformRequest(params);
      var canceller = $q.defer();
      var request = $http.post(
        tryton.serverUrl + (database || ''),
        {
          'method': method,
          'params': _params || []
        },
        {
          headers: {
            'Authorization': 'Session ' + session
          },
          timeout: canceller.promise
        }
      );
      request.canceller = canceller;
      return request;
    };

    /**
      @ngdoc method
      @name getServerVersion
      @methodOf fulfil.angular-tryton.service:tryton

      @description
        Convenience wrapper to fetch server version.

      @returns {Promise} Promise that will be resolved on successful response.

      @example
        <example module="example">
          <file name="index.html">
           <div ng-controller="TrytonCtrl">
             <span ng-init="getServerVersion()">
               Server Version: {{ serverVersion }}
             </span>
           </div>
          </file>
          <file name="app.js">
             angular.module('example', [
               'fulfil.angular-tryton'
             ])
             .controller('TrytonCtrl', [
               '$scope',
               'tryton',
               function ($scope, tryton) {
                 tryton.serverUrl = '/';
                 $scope.getServerVersion = function () {
                   // Call Tryton JsonRPC server and return promise.
                   tryton.getServerVersion()
                     .success(function (result) {
                       // Do something with result
                       $scope.serverVersion = result;
                     });
                 }
               }
             ]);
          </file>
        </example>
    **/
    this.getServerVersion = function() {
      return tryton.rpc('common.version', [null, null]);
    };

  }])

  /**
   * @ngdoc service
   * @name fulfil.angular-tryton.service:session
   *
   * @description
   * High level service to invoke `tryton` service.
   *
   * While this method exposes the implementation of the RPC client, this is
   * required only when you have to call a common service (eg. getting server
   * version) or authenticating. The `rpc` method takes parameters which should
   * include the user ID and session.
   *
   * The `session` service provides a higher level abstraction which offers an
   * RPC client that automatically handles authentication and context for you.
   *
   */
  .service('session', ['tryton', '$localStorage', '$q', function(tryton, $localStorage, $q) {
    // Controller for managing tryton session

    var session = this;

    /**
      @ngdoc property
      @name userId
      @propertyOf fulfil.angular-tryton.service:session

      @description
        The Integer ID of the currently logged in User
    **/
    this.userId = null;

    /**
      @ngdoc property
      @name sessionId
      @propertyOf fulfil.angular-tryton.service:session

      @description
        The Session ID of the current session (issued by tryton server)
    **/
    this.sessionId = null;

    /**
      @ngdoc property
      @name database
      @propertyOf fulfil.angular-tryton.service:session

      @description
        The database to which this session connects to
    **/
    this.database = null;

    /**
      @ngdoc property
      @name login
      @propertyOf fulfil.angular-tryton.service:session

      @description
        The login/username used to connect to tryton. This has to be remembered
        for just asking for the password when a session times out.
    **/
    this.login = null;

    // The context object of the session. This is the default context from the
    // preferences of the logged in user.
    session.context = null;

    /**
      @ngdoc method
      @name loadAllFromStorage
      @methodOf fulfil.angular-tryton.service:session

      @description
        Sets session properties from localStorage.

        To be prcise, loads sessionId and context from localStorage and userId,
        login, database from localStorage.
    **/
    session.loadAllFromStorage = function() {
      // Load the values of the variables from the localStorage.
      session.userId = $localStorage.userId;
      session.sessionId = $localStorage.sessionId;
      session.database = $localStorage.database;
      session.login = $localStorage.login;
      session.context = $localStorage.context;
      tryton.serverUrl = $localStorage.serverUrl || '/';
    };

    // Since the service is a singleton, on the first run just load whatever
    // is already in the session.
    session.loadAllFromStorage();

    var clearSession = function() {
      // Clear the session for a brand new connection
      session.userId = null;
      session.sessionId = null;
      session.context = null;

      // Now remove the values from the cookie store
      delete $localStorage.userId;
      delete $localStorage.sessionId;
      delete $localStorage.context;
    };

    /**
      @ngdoc method
      @name setSession
      @methodOf fulfil.angular-tryton.service:session

      @description
        Set the user and session ID and also save them to localStorage for
        retrieval. Set null if value is undefined; happens when user attempts to
        log in to incompatible database.

        ***Note:** This method need not be explicitly called as `session.doLogin`
        automatically calls this method on successful login.

      @param {string} [database=null] Tryton database on which this request need
                                    to be processed.
      @param {string} login The login/username used to connect to tryton.
      @param {integer} userId The UserId of currently logged in user.
      @param {string} sessionId The Session ID of the current session (issued by
                                tryton server).
    **/
    this.setSession = function(_database, _login, _userId, _sessionId) {
      $localStorage.database = _database || null;
      $localStorage.login = _login || null;
      $localStorage.userId = _userId || null;
      $localStorage.sessionId = _sessionId || null;

      // Now that everything is stored to localStorage, reuse the loadAllFromStorage
      // method to load values into variables here.
      session.loadAllFromStorage();
    };


    /**
      @ngdoc method
      @name rpc
      @methodOf fulfil.angular-tryton.service:session

      @description
        Make remote procedure call on the given `method` with the `params` and
        optional `context`. This is a convenience wrapper over `tryton.rpc`. It
        automatically constructs the parameters as required by `tryton.rpc` (with
        userID, session and the context).

        Example:

        ```js
        session.rpc(
          'party.party.read',   // method
          [[1, 2], ['name']],   // params: ids, field_names
          {company: 1}          // context
        )
        ```

        Equivalent Python:

        ```python
        with Transaction().set_context(company=1):
          Party.read([1, 2], ['name'])
        ```

      @param {string} method Name of the RPC method that need to be called
                             (Ex. `'party.party.read'`).
      @param {array} params Parameters to be passed to the method.
                            Unlike, `tryton.rpc` you do not have to pass the
                            userID, session or the context. They are automatically
                            constructed, before being passed to `tryton.rpc`.
                            (Ex. `[[1, 2], ['name']]`)
      @param {Object} context A javascript object with any additional context that
                              needs to be set. The context is merged with the
                              default context in the server. The default context
                              is the context returned by the get_preferences
                              method.
                              Note: JavaScript object should be JSON serializable.
                              (Ex: `{company: 1}`)

    **/
    this.rpc = function(_method, _params, _context) {
      // Reload session from localStorage making localStorage as single source
      // of truth.
      session.loadAllFromStorage();

      // Make a remote procedure call to tryton with the current user ID
      // session and the database in the session

      // Construct parameters: [userId, sessionId, param1, param2,... context]
      var params = goog.array.clone(_params || []);

      var requestContext = angular.copy((session.context || {}));
      if (_context !== undefined) {
        angular.extend(requestContext, _context);
      }
      params.push(requestContext);

      return tryton.rpc(_method, params, session.database, session.sessionId);
    };

    /**
      @ngdoc method
      @name doLogout
      @methodOf fulfil.angular-tryton.service:session

      @description
        Log the current user out and clear out the session.

      @returns {Promise} Promise that will be resolved on successful response.
    **/
    this.doLogout = function() {
      // Reload session from localStorage making localStorage as single source
      // of truth.
      session.loadAllFromStorage();

      var promise = tryton.rpc(
        'common.db.logout', [], session.database, session.sessionId
      );
      // Clean logout of the user
      clearSession();
      return promise;
    };

    this.setDefaultContext = function (_context) {
      $localStorage.context = _context || null;
      session.loadAllFromStorage();
    };

    var _tryLogin = function(_database, _username, _password) {
      // call login on tryton server and if the login is succesful set the
      // userId and session
      var deferred = $q.defer();
      tryton.rpc( 'common.db.login', [_username, _password], _database)
       .success(function(result) {
         // Since trytond returns an Array with userId and sessionId on successful
         // login and an error Object on error; false if bad credentials.
         if (result instanceof Array) {
           var sessionId = goog.crypt.base64.encodeString(
             _username + ':' + result[0] + ':' + result[1]
           );
           session.setSession(_database, _username, result[0], sessionId);
         }
         deferred.resolve(result);
       })
       .error(function(reason) {
         deferred.reject(reason);
       });
      return deferred.promise;
    };

    /**
      @ngdoc property
      @name loginMethod
      @propertyOf fulfil.angular-tryton.service:session

      @description
        Method to use for login
    **/
    this.loginMethod = undefined;


    /**
     * Reload default context
     *
     * This is special case where context should be sent as null.
     */
    this.refreshDefaultContext = function () {
      return tryton.rpc(
        'model.res.user.get_preferences', [true, {}],
        session.database, session.sessionId
      ).success(function(preferences) {
        session.setDefaultContext(preferences);
      });
    };


    /**
      @ngdoc method
      @name doLogin
      @methodOf fulfil.angular-tryton.service:session

      @description
        Login to the given `database` using `username` and `password`.
        If the login is successful, the method calls `session.setSession` and
        saves the session token which can be used for subsequent requests made
        through `session.rpc`.

        Optional boolean value `getPreferences` can be passed as the 4 argument
        to set default tryton context.

      @returns {Promise} Promise that will be resolved on successful response.
    **/
    this.doLogin = function(_database, _username, _password, getPreferences) {
      // `loginDeferred` checks for login success/error
      var loginDeferred = $q.defer();
      // Even if user has been successfully logged in, failing to `getPreferences`
      // (if true) should make the call to `doLogin` failed as a whole, which is
      // done in `finalDeferred`.
      var finalDeferred = $q.defer();
      var loginMethod = this.loginMethod || _tryLogin;

      var urlRegex = /^https?:\/\//i;
      var loginPromise;
      // Make sure URL has http or https in it.
      if(urlRegex.test(tryton.serverUrl) || tryton.serverUrl === '/') {
        loginPromise = loginMethod(_database, _username, _password);
      } else {
        // If URL doesn't have protocol, try https first then http.
        tryton.setServerUrl('https://' + tryton.serverUrl);
        loginPromise = loginDeferred.promise;
        loginMethod(_database, _username, _password)
          .then(function(result){
            loginDeferred.resolve(result);
          }, function(reason){
            if(!reason) {
              // Couldn't login, try again with http.
              tryton.setServerUrl(
                tryton.serverUrl.replace(/^https/i, 'http')
              );
              loginMethod(_database, _username, _password)
                .then(function(result){
                  loginDeferred.resolve(result);
                }, function(reason){
                  loginDeferred.reject(reason);
                });
            } else {
              loginDeferred.reject(reason);
            }
          });
      }

      // Get the user preferences if user has asked for it.
      loginPromise.then(function(loginResponse) {
        if(!getPreferences) {
          finalDeferred.resolve(loginResponse);
        } else {
          session.refreshDefaultContext()
            .success(function(preferences) {
              finalDeferred.resolve(loginResponse);
            })
            .error(function(reason) {
              finalDeferred.reject(reason);
            });
        }
      }, function(reason) {
        finalDeferred.reject(reason);
      });

      var promise = finalDeferred.promise;
      promise.success = function(fn) {
        promise.then(function(response) {
          fn(response);
        });
        return promise;
      };

      promise.error = function(fn) {
        promise.then(null, function(response) {
          fn(response);
        });
        return promise;
      };
      return finalDeferred.promise;
    };

    /**
      @ngdoc method
      @name isLoggedIn
      @methodOf fulfil.angular-tryton.service:session

      @description
        Check if the user is logged in.

        ***Note:** This method does not guarantee that the session is still valid.
        It only ensures that the user logged in once.

      @returns {bool} `true` or `false`
    **/
    this.isLoggedIn = function () {
      return !!session.sessionId;
    }

  }])


    /**
      @ngdoc filter
      @name fulfil.angular-tryton.service:urlTryton

      @description
        Create a tryton scheme URL which can be opened with the URL handlers of
        the operating system. This is useful if you want to cross link to records
        or windows that you need to open on the tryton client from your web
        application.

        Example:

        ```html
        <a href="{{ 'party.party'|urlTryton:party.id }}">
         Click here to open Party:{{ party.name }} in your tryton client
        </a>
        ```

      @param {string} name Name of the resource (model/wizard/report).
                           Ex: `party.party`
      @param {integer} [id=null] Optional id of the record. Leaving this empty
                                 would trigger a list view on tryton
      @param {string} [type='model'] Type of the resource identified by name. It
                                     could be `'model'`, `'wizard'` or `'report'`.

    **/
  .filter('urlTryton', function ($window, tryton, session) {
    return function (name, id, type_) {
      type_ = type_ || 'model';
      if (!name) {
        throw new Error("Name in urlTryton filter is required.");
      }
      var values = [];
      var serverUrl = tryton.serverUrl;
      if (/^[\w]+:\/\//.test(serverUrl)) {
        // Check if url has protocol attached
        serverUrl = serverUrl.substring(serverUrl.indexOf(':'));
      }
      else {
        // Set server url as current host
        serverUrl = '://' + window.location.host + serverUrl;
      }
      values.push(serverUrl + session.database);
      values.push(type_);
      values.push(name);
      if (id) {
        values.push(id);
      }
      return 'tryton' + values.join('/');
    };
  })

  .service('pyson', PYSON);

});    // goog.scope
