angular.module('gwApiClient', []).service('gwApi', function ($q, $http, $timeout, $httpParamSerializerJQLike) {

    var me = this;

    var initialized = false;

    var devBaseUrl = 'https://apidev.growish.com/v1';
    var prodBaseUrl = 'https://api.growish.com/v1';

    var session;

    var defaults = {
        env: 'developing',
        baseUrl: devBaseUrl,
        preserveUserSession: true,
        localStorageFile: 'gw-api-data'
    };

    var config = {};

    var MethodCollection = function () {

        var data = [];

        this.find = function (m) {
            for (var x = 0; x < data.length; x++) {
                if (data[x].name === m)
                    return data[x];
            }
            return null;
        };

        this.add = function (name, endPoint, seed) {
            data.push(new MethodClass(name, endPoint, seed));

        };
    };

    var MethodClass = function (name, endPoint, seed) {
        this.name = name;
        this.endPoint = endPoint;
        this.seed = (typeof seed !== 'undefined') ? seed : null;
        this.mapper = {};
    };

    MethodClass.prototype.getEndPoint = function (args, urlParams) {

        var url = this.endPoint.replace(/{(\d+)}/g, function (match, number) {
            return typeof args[number] !== 'undefined'
                ? args[number]
                : match
                ;
        });


        var str = "";
        for (var key in urlParams) {
            if (str !== "") {
                str += "&";
            }
            str += key + "=" + urlParams[key];
        }
        if (str)
            return url + '?' + str;
        else
            return url;

    };

    var methods = new MethodCollection();


    //http://growish.github.io/api-doc/#api-Authorization-authorization
    methods.add('auth', '/auth/');

    //http://growish.github.io/api-doc/#api-User-getUser
    //http://growish.github.io/api-doc/#api-User-updateUser
    methods.add('user', '/user/{0}/');

    //http://growish.github.io/api-doc/#api-User-newUser
    methods.add('newUser', '/user/');

    //http://growish.github.io/api-doc/#api-User-wallets
    methods.add('wallets', '/user/{0}/wallet/');

    methods.add('listWallets', '/user/{0}/list/');

    methods.add('newListWallet', '/list/');

    //http://growish.github.io/api-doc/#api-Wallet-getWallet
    //http://growish.github.io/api-doc/#api-Wallet-updateWallet
    methods.add('wallet', '/wallet/{0}/');

    //http://growish.github.io/api-doc/#api-Wallet-newWallet
    methods.add('newWallet', '/wallet/');

    methods.add('list.product', '/list/{0}/product/{1}/');

    //http://growish.github.io/api-doc/#api-User-deleteContact
    //http://growish.github.io/api-doc/#api-User-newAddressBook
    //http://growish.github.io/api-doc/#api-User-getAddressBook
    methods.add('user.addressBook', '/user/{0}/address-book/');

    //http://growish.github.io/api-doc/#api-User-updateCreditCard
    //http://growish.github.io/api-doc/#api-User-newCreditCard
    //http://growish.github.io/api-doc/#api-User-user_creditCard
    methods.add('user.creditCard', '/user/{0}/credit-card/');

    //http://growish.github.io/api-doc/#api-User-newCommonFund
    //http://growish.github.io/api-doc/#api-User-deleteCommonFund
    //http://growish.github.io/api-doc/#api-User-getCommonFund
    //http://growish.github.io/api-doc/#api-User-editCommonFund
    methods.add('user.commonFund', '/user/{0}/common-fund/');

    //http://growish.github.io/api-doc/#api-parserExcel-parserExcel
    methods.add('parserExcel', '/parserexcel/');

    //http://growish.github.io/api-doc/#api-List-ImportContacts
    methods.add('list.guests', '/list/{0}/guests/');

    //http://growish.github.io/api-doc/#api-User-shareAddressBook
    methods.add('user.addressBookShare', '/user/{0}/address-book-share/');

    methods.add('restorePassword', '/passwordrecovery/');



    var RequestClass = function (method, args) {

        this.read = function (urlParams, cache) {
            return new ServerCallPromise(method, args, null, 'GET', urlParams, cache);
        };

        this.save = function (body) {
            return new ServerCallPromise(method, args, body, 'POST', null, null);
        };

        this.update = function (body) {
            return new ServerCallPromise(method, args, body, 'PUT', null, null);
        };

        this.delete = function () {
            return new ServerCallPromise(method, args, null, 'DELETE', null, null);
        }

    };

    var ErrorResponseClass = function () {
        this.code = -1;
        this.validationErrors = {};
        this.handled = false;
        this.message = null;
    };

    var ServerCallPromise = function (_method, _args, _body, verb, _urlParams, cache) {

        var method = angular.copy(_method);
        var args = angular.copy(_args);
        var body = angular.copy(_body);
        var urlParams = angular.copy(_urlParams);

        var deferred = $q.defer();

        var endPoint = method.getEndPoint(args, urlParams);

        if (body && method.mapper.out)
            body = method.mapper.out(body);

        if (method.seed) {
            debugMsg('Resolving ' + endPoint + ' from seed');

            $timeout(function () {

                if (method.mapper.in)
                    deferred.resolve(method.mapper.in(method.seed));
                else
                    deferred.resolve(method.seed);

            }, Math.floor((Math.random() * 1000) + 1000));

            return deferred.promise;
        }

        var headers = [];
        headers['X-App-Key'] = config.appKey;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';


        if (session && session.token)
            headers['X-Auth-Token'] = session.token;

        var httpOptions = {
            cache: false,
            method: verb,
            data: (body) ? $httpParamSerializerJQLike(body) : null,
            url: config.baseUrl + endPoint,
            headers: headers,
            transformRequest: angular.identity
        };

        if(verb === 'GET' && cacheManager.inCache(httpOptions.url)) {
            httpOptions.cache = true;
            debugMsg('Pulling ' + httpOptions.url + ' from cache');
        }

        if(cache) {
            cacheManager.add(httpOptions.url, cache);
        }


        $http(httpOptions)
            .then(
                function success(response) {
                    if (method.mapper.in)
                        deferred.resolve(method.mapper.in(response.data.data));
                    else
                        deferred.resolve(response.data.data);
                },
                function error(err) {

                    var response = new ErrorResponseClass();
                    response.code = err.status;

                    if(err.status === 400) {

                        angular.forEach(err.data.message, function (errors, field) {
                            angular.forEach(errors, function (msg, error) {
                                response.validationErrors[field] = msg;
                            });
                        });

                        if(typeof config.error400 === 'function') {
                            response.handled = true;
                            config.error400(response);
                        }

                        deferred.reject(response);
                    }
                    else if(err.status === 401 && typeof config.error401 === 'function') {
                        response.handled = true;
                        config.error401(err.data);
                        deferred.reject(response);
                    }
                    else if(err.status === 403 && typeof config.error403 === 'function') {
                        response.handled = true;
                        response.message = err.data.message;
                        config.error403(err.data);
                        deferred.reject(response);
                    }
                    else
                        deferred.reject(response);
            });


        return deferred.promise;

    };


    this.updateSession = function (user) {
        session.firstName = user.firstName;
        session.lastName = user.lastName;
        session.birthday = user.birthday;
        session.taxCode = user.taxCode;

        localStorage.setItem(config.localStorageFile, angular.toJson(session));
    };

    this.setSession = function (user) {
        session = user;
        localStorage.setItem(config.localStorageFile, angular.toJson(user));
    };

    this.session = function () {
        var deferred = $q.defer();

        if (session) {
            debugMsg('Session found in cache');
            deferred.resolve(session);
        }
        else {
            var _session = localStorage.getItem(config.localStorageFile);
            if (_session)
                _session = angular.fromJson(_session);

            if (_session && _session.id) {
                session = _session;
                me.request('user', session.id).read().then(
                    function success() {
                        debugMsg('Session found in local storage and validated in API');
                        deferred.resolve(session);
                    },
                    function error() {
                        debugMsg('Session found in local storage but invalidated in API');
                        localStorage.removeItem(config.localStorageFile);
                        deferred.reject();
                    }
                );
            }
            else {
                debugMsg('No session found');
                deferred.reject();
            }
        }

        return deferred.promise;
    };

    this.logout = function () {
        var deferred = $q.defer();

        me.request('auth').delete().then(
            function () {
                session = null;
                localStorage.removeItem(config.localStorageFile);
                deferred.resolve();
            },
            function (err) {
                deferred.reject(err);
            }
        );

        return deferred.promise;
    };

    this.initialize = function (options) {
        if (typeof options.baseUrl === 'undefined' && typeof options.env !== 'undefined' && options.env === 'production')
            options.baseUrl = prodBaseUrl;

        angular.extend(config, defaults, options);
        initialized = true;
        debugMsg('I have been initialized with this config', config);
    };

    this.addSeed = function (methodName, data) {
        var method = methods.find(methodName);

        if (!method) {
            debugMsg('Method ' + methodName + ' is not defined.');
            return false;
        }

        method.seed = data;


    };

    this.request = function () {

        var methodName = arguments[0];

        if (!initialized) {
            debugMsg('You need to initialize the API client first');
            return false;
        }

        var method = methods.find(methodName);

        if (!method) {
            debugMsg('Method ' + methodName + ' is not defined.');
            return false;
        }

        var payload = [];
        for (var x = 1; x < arguments.length; x++) {
            payload.push(arguments[x]);
        }

        return new RequestClass(method, payload);

    };

    this.authenticate = function (email, password) {
        return me.request('auth').save({email: email, password: password});
    };

    this.addMapper = function (methodName, mapper) {
        var method = methods.find(methodName);
        if (!method) {
            debugMsg('Method ' + methodName + ' do not exist');
            return false;
        }

        if (typeof mapper.in !== 'function' || typeof mapper.out !== 'function') {
            debugMsg('The mapper object is not defined correctly');
            return false;
        }

        method.mapper = mapper;

    };

    var CacheClass = function () {

        var _cachedUrl = [];

        var getCachedIndex = function (url) {
            for (var x = 0; x < _cachedUrl.length; x++) {
                if (_cachedUrl[x].url === url) {
                    return x;
                }
            }
            return -1;
        };

        this.inCache = function (url) {

            var now = new Date().getTime();
            var x = getCachedIndex(url);

            console.table(_cachedUrl);

            if(x >= 0) {
                if (!_cachedUrl[x].expire || _cachedUrl[x].expire <= now) {
                    _cachedUrl[x].expire = null;
                    return false;
                }
                return true;
            }
            return false;
        };
        this.add = function (url, time) {

            var now = new Date().getTime();
            var x = getCachedIndex(url);

            if(x >= 0) {
                _cachedUrl[x].expire = now + time * 1000;
                return true;
            }

            _cachedUrl.push({
                url: url,
                expire: now
            });

            return true;
        };
    };

    var cacheManager = new CacheClass();

    var debugMsg = function (msg, obj) {
        if (config.env !== 'production')
            console.log('***', 'GW API CLIENT:', msg, '***');
        if (obj)
            console.log(obj);
    };


})
;