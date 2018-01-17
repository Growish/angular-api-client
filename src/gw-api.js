angular.module('gwApiClient', []).service('gwApi', function ($q, $http, $timeout, $httpParamSerializerJQLike, $cacheFactory) {

    var me = this;

    var initialized = false;

    var $httpDefaultCache = $cacheFactory.get('$http');

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

    methods.add('commonFundStatement', '/commonfund-statement/{0}/');

    methods.add('walletInvite', '/wallet/{0}/invite/');

    methods.add('beneficiary', '/beneficiary/');

    methods.add('withdrawal', '/withdrawal/');

    methods.add('setWalletImage', '/wallet/{0}/image/');

    methods.add('business', '/business/');

    methods.add('chargeWallet', '/charge-wallet/');

    methods.add('transferContribution', '/transfer_contribution/');

    methods.add('getList', '/list/{0}/');

    methods.add('sendMoney', '/transfer/');

    methods.add('checkContribution', '/check-contribution/{0}/');

    methods.add('addressInvite', '/wallet/{0}/address-invite/');

    methods.add('accessToken', '/access-token/{0}/');

    methods.add('addNewProduct', '/wallet/{0}/product/');

    methods.add('deleteProduct', '/wallet/{0}/product/{1}/');

    methods.add('smsinvite', '/smsinvite/');

    methods.add('giftCard', '/giftcard/');

    methods.add('buyProduct', '/buyproduct/');

    methods.add('fbAuth', '/fbauth/');

    methods.add('agencyVisitNotification', '/agency-visit-notification/');

    methods.add('blogPost', '/blog-posts/');

    methods.add('userKycAuthentication', '/user-kyc-authentication/');

    methods.add('saasPartner', '/saas-partner/');

    methods.add('saasBusiness', '/saas-business/');

    methods.add('preUser', '/pre-user/');

    methods.add('downloadEbook', '/download-ebook/');

    methods.add('feedaty', '/feedaty/');

    methods.add('application', '/application/');

    methods.add('agency', '/agency/{0}/');

    methods.add('searchList', '/list/');

    methods.add('agencySearchList', '/agency/{0}/list/');

    methods.add('rsvp', '/list/{0}/rsvp/');

    methods.add('listMessage', '/list/{0}/message/');

    methods.add('fastAssistance', '/fastassistance/');

    methods.add('onDemandHelp', '/ondemandhelp/?mode=info');

    methods.add('getPdfStatement', '/pdf-statement/{0}/');

    methods.add('changeRsvp', '/changersvp/');

    methods.add('unseatUser', '/unseatuser/');

    methods.add('seatUser', '/seatuser/');

    methods.add('setGuest', '/list/{0}/guest/');

    methods.add('requestRsvp', '/rsvp/');

    methods.add('deletePeople', '/delete-people/');

    methods.add('sendAdminMessage', '/admin_msg/');

    methods.add('weddingPremiumProducts', '/premium-products/?catalog=listanozze');

    methods.add('premiumProductSold', '/premium-product-sold/');

    methods.add('table', '/list/{0}/table/');

    methods.add('updateTable', '/list/{0}/table/{1}/');

    methods.add('toDo', '/list/{0}/todo/');

    methods.add('updateToDo', '/list/{0}/todo/{1}/');

    methods.add('lastBeneficiary', '/lastbeneficiary/{0}/');

    methods.add('pdfMessage', '/list/{0}/pdf-message/');

    methods.add('walletProductPosition', '/wallet-product-position/{0}/');

    methods.add('listDelete', '/listdelete/');

    methods.add('list.image', '/list/{0}/image/');

    methods.add('setListProduct', '/list/{0}/product/');

    methods.add('agencyamount', '/agencyamount/');

    methods.add('setGuests', '/list/{0}/guests/');

    methods.add('setProductImage', '/list/{0}/product/{1}/image/');

    methods.add('processPremiumProduct', '/process-premium-product/{0}/');

    methods.add('newCart', '/cart/');

    methods.add('cart.addProduct', '/cart/{0}/product/');

    methods.add('cart', '/cart/{0}/');

    methods.add('cart.product', '/cart/{0}/product/{1}');

    var RequestClass = function (method, args) {

        var me = this;
        var fullResponse = false;

        this.read = function (urlParams, cache) {
            return new ServerCallPromise(method, args, null, 'GET', urlParams, cache, fullResponse);
        };

        this.save = function (body) {
            return new ServerCallPromise(method, args, body, 'POST', null, null, fullResponse);
        };

        this.update = function (body) {
            return new ServerCallPromise(method, args, body, 'PUT', null, null, fullResponse);
        };

        this.delete = function () {
            return new ServerCallPromise(method, args, null, 'DELETE', null, null, fullResponse);
        };

        this.setFullResponse = function () {
            fullResponse = true;
            return me;
        }

    };

    var ErrorResponseClass = function () {
        this.code = -1;
        this.validationErrors = {};
        this.validationErrorsFull = {};
        this.handled = false;
        this.message = null;
    };

    var ServerCallPromise = function (_method, _args, _body, verb, _urlParams, cache, fullResponse) {
        var method = angular.copy(_method);
        var args = angular.copy(_args);

        var body;
        if(_body && _body.constructor.name === "File") {
            body = _body;
        }
        else if (_body && verb === 'POST') {
            body = angular.copy(_body);
        }
        else {
            body = angular.copy(_body);
        }

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
        else if(body && verb === 'POST') {
            headers['Content-Type'] = undefined;
            data = new FormData();
            for (var property in body) {
                if (body.hasOwnProperty(property)) {
                    if (body[property] && _body[property].constructor.name === "File") {
                        data.append(property, _body[property]);
                    } else if (typeof body[property] !== 'undefined') {
                        data.append(property, body[property]);
                    }

                }
            }

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

        if(verb === 'GET' && cacheManager.inCache(httpOptions.url) === 'expired') {
            $httpDefaultCache.remove(httpOptions.url);
            debugMsg('Dropping cache for ' + httpOptions.url);
        }
        else if(verb === 'GET' && cacheManager.inCache(httpOptions.url) === 'cached') {
            httpOptions.cache = true;
            debugMsg('Cache found for ' + httpOptions.url);
        }
        else if(verb === 'GET' && cache) {
            cacheManager.add(httpOptions.url, cache);
            httpOptions.cache = true;
            debugMsg('Caching ' + httpOptions.url);
        }

        debugMsg(httpOptions);
        $http(httpOptions)
            .then(
                function success(response) {

                    var payload;

                    if(!fullResponse)
                        payload = method.mapper.in ? method.mapper.in(response.data.data) : response.data.data;
                    else
                        payload = {
                            data: method.mapper.in ? method.mapper.in(response.data.data) : response.data.data,
                            pagination: response.data.pagination,
                            message: typeof response.data.message === 'string' ? response.data.message : null
                        };


                    deferred.resolve(payload);

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

    var dropSession = function () {
        session = null;
        localStorage.removeItem(apiConfig.localStorageFile);
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

        me.request('auth').delete().then(
            function () {
                deferred.resolve();
            },
            function (err) {
                deferred.reject(err);
            }
        ).finally(dropSession);

        return deferred.promise;
    };

    this.dropSession = function () {
        dropSession();
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

    this.clearCache = function () {
        console.log($httpDefaultCache.info());
        $httpDefaultCache.removeAll();
        console.log($httpDefaultCache.info());
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

        this.clear = function () {
          _cachedUrl = [];
        };

        this.inCache = function (url) {

            var now = new Date().getTime();
            var x = getCachedIndex(url);

            if(x >= 0) {
                if (!_cachedUrl[x].expire || _cachedUrl[x].expire <= now) {
                    _cachedUrl.splice(x,1);
                    return 'expired';
                }
                return 'cached';
            }
            return null;
        };

        this.add = function (url, time) {

            var now = new Date().getTime();
            var x = getCachedIndex(url);

            if(x >= 0) {
                if(_cachedUrl[x].expire > now)
                    return true;

                _cachedUrl[x].expire = now + time * 1000;
                return true;
            }

            _cachedUrl.push({
                url: url,
                expire: now + time * 1000
            });

            return true;
        };
    };

    var cacheManager = new CacheClass();

    this.flushCache = function () {
        cacheManager.clear();
        return true;
    };

    var debugMsg = function (msg, obj) {
        if (apiConfig.env !== 'production') {
            console.log('***', 'GW API CLIENT:', msg, '***');
            if (obj)
                console.log(obj);
        }
    };

});