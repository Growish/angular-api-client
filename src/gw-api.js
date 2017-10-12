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


    var apiConfig = {};

    this.getBaseUrl = function () {
        return apiConfig.baseUrl;
    };

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
    methods.add('user', '/user/{0}/');

    //http://growish.github.io/api-doc/#api-User-newUser
    methods.add('newUser', '/user/');

    //http://growish.github.io/api-doc/#api-User-wallets
    methods.add('wallets', '/user/{0}/wallet/');

    methods.add('listWallets', '/user/{0}/list/');

    methods.add('listWallet.statement', '/statement/{0}/');

    methods.add('newListWallet', '/list/');

    //http://growish.github.io/api-doc/#api-Wallet-getWallet
    methods.add('wallet', '/wallet/{0}/');

    //http://growish.github.io/api-doc/#api-Wallet-newWallet
    methods.add('newWallet', '/wallet/');

    methods.add('list.product', '/list/{0}/product/{1}/');

    //http://growish.github.io/api-doc/#api-User-deleteContact
    methods.add('user.addressBook', '/user/{0}/address-book/');

    //http://growish.github.io/api-doc/#api-User-updateCreditCard
    methods.add('user.creditCard', '/user/{0}/credit-card/');


    //http://growish.github.io/api-doc/#api-parserExcel-parserExcel
    methods.add('parserExcel', '/parserexcel/');

    methods.add('user.importAddressBook', '/user/{0}/import-address-book/');

    //http://growish.github.io/api-doc/#api-User-shareAddressBook
    methods.add('user.addressBookShare', '/user/{0}/address-book-share/');

    methods.add('restorePassword', '/passwordrecovery/');

    methods.add('setImageUser', '/user/{0}/image/');

    methods.add('user.addChild', '/user/{0}/add-child/');

    methods.add('user.updateAddressBook', '/user/{0}/address-book/{1}/');

    methods.add('search.organization', '/search/organization/');

    methods.add('newCommonFund', '/common-fund-wallet/');

    methods.add('user.commonFunds', '/user/{0}/common-fund-wallet/');

    methods.add('commonFund', '/common-fund-wallet/{0}/');

    methods.add('closeCommonFundWallet', '/close-common-fund-wallet/{0}/');

    methods.add('fee', '/fee/');

    methods.add('setSchool', '/school/');

    methods.add('closeWallet', '/closewallet/');

    methods.add('cardContribution', '/card_contribution/');

    methods.add('withdrawalContribution', '/withdrawal_contribution/');

    methods.add('walletComment', '/wallet/{0}/comment/');

    methods.add('updatePerks', '/wallet/{0}/perk/{1}/');

    methods.add('user.notifications', '/user/{0}/notification/');

    methods.add('notification', '/checknoti/{0}/');

    methods.add('addPerk', '/wallet/{0}/perk/');

    methods.add('statement', '/statement/{0}/');

    methods.add('walletInvite', '/wallet/{0}/invite/');

    methods.add('beneficiary', '/beneficiary/');

    methods.add('withdrawal', '/withdrawal/');

    methods.add('setWalletImage', '/wallet/{0}/image/');

    methods.add('business', '/business/');

    methods.add('chargeWallet', '/charge-wallet/');

    methods.add('transferContribution', '/transfer_contribution/');

    methods.add('searchOrganization', '/search-organization/');



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
        this.validationErrorsFull = {};
        this.handled = false;
        this.message = null;
    };

    var ServerCallPromise = function (_method, _args, _body, verb, _urlParams, cache) {
        var method = angular.copy(_method);
        var args = angular.copy(_args);

        var body;
        if(_body && _body.constructor.name === "File")
            body = _body;
        else
            body = angular.copy(_body);



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
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        var data = null;

        if(body && body.constructor.name === "File") {
            headers['Content-Type'] = undefined;

            data = new FormData();
            data.append('0', body);

        }
        else if(body){
            data = $httpParamSerializerJQLike(body);
        }

        headers['X-App-Key'] = apiConfig.appKey;


        if (session && session.token)
            headers['X-Auth-Token'] = session.token;

        var httpOptions = {
            cache: false,
            method: verb,
            data: data,
            url: apiConfig.baseUrl + endPoint,
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

                        response.validationErrorsFull = err.data.message;

                        angular.forEach(err.data.message, function (errors, field) {
                            angular.forEach(errors, function (msg, error) {
                                response.validationErrors[field] = msg;
                            });
                        });

                        if(typeof apiConfig.error400 === 'function') {
                            response.handled = true;
                            apiConfig.error400(response);
                        }

                        deferred.reject(response);
                    }
                    else if(err.status === 401 && typeof apiConfig.error401 === 'function') {
                        response.handled = true;
                        apiConfig.error401(err.data);
                        deferred.reject(response);
                    }
                    else if(err.status === 403 && typeof apiConfig.error403 === 'function') {
                        response.handled = true;
                        response.message = err.data.message;
                        apiConfig.error403(err.data);
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

        localStorage.setItem(apiConfig.localStorageFile, angular.toJson(session));
    };

    this.setSession = function (user) {
        session = user;
        localStorage.setItem(apiConfig.localStorageFile, angular.toJson(user));
    };

    this.session = function (i) {
        if (typeof i !== "undefined" && i) {
            return session;
        }
        var deferred = $q.defer();

        if (session) {
            debugMsg('Session found in cache');
            deferred.resolve(session);
        }
        else {
            var _session = localStorage.getItem(apiConfig.localStorageFile);
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
                        localStorage.removeItem(apiConfig.localStorageFile);
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

        session = null;
        localStorage.removeItem(apiConfig.localStorageFile);

        me.request('auth').delete().then(
            function () {
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

        angular.extend(apiConfig, defaults, options);
        initialized = true;
        debugMsg('I have been initialized with this config', apiConfig);
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
        if (apiConfig.env !== 'production') {
            console.log('***', 'GW API CLIENT:', msg, '***');
            if (obj)
                console.log(obj);
        }
    };


});