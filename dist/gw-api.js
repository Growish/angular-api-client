// Compiled Tue Aug 28 2018 11:34:12 GMT+0200 (CEST)
!function(a,b){"use strict";function c(a,c,d){function g(a,d,f){var g,h;f=f||{},h=f.expires,g=b.isDefined(f.path)?f.path:e,b.isUndefined(d)&&(h="Thu, 01 Jan 1970 00:00:00 GMT",d=""),b.isString(h)&&(h=new Date(h));var i=encodeURIComponent(a)+"="+encodeURIComponent(d);i+=g?";path="+g:"",i+=f.domain?";domain="+f.domain:"",i+=h?";expires="+h.toUTCString():"",i+=f.secure?";secure":"";var j=i.length+1;return j>4096&&c.warn("Cookie '"+a+"' possibly not set or overflowed because it was too large ("+j+" > 4096 bytes)!"),i}var e=d.baseHref(),f=a[0];return function(a,b,c){f.cookie=g(a,b,c)}}b.module("ngCookies",["ng"]).provider("$cookies",[function(){function d(a){return a?b.extend({},c,a):c}var c=this.defaults={};this.$get=["$$cookieReader","$$cookieWriter",function(a,c){return{get:function(b){return a()[b]},getObject:function(a){var c=this.get(a);return c?b.fromJson(c):c},getAll:function(){return a()},put:function(a,b,e){c(a,b,d(e))},putObject:function(a,c,d){this.put(a,b.toJson(c),d)},remove:function(a,b){c(a,void 0,d(b))}}}]}]),b.module("ngCookies").factory("$cookieStore",["$cookies",function(a){return{get:function(b){return a.getObject(b)},put:function(b,c){a.putObject(b,c)},remove:function(b){a.remove(b)}}}]),c.$inject=["$document","$log","$browser"],b.module("ngCookies").provider("$$cookieWriter",function(){this.$get=c})}(window,window.angular);
angular.module('gwApiClient', ['ngCookies'])

    .service('gwApi', ['$q', '$http', '$timeout', '$httpParamSerializerJQLike', '$cacheFactory', '$cookies', '$location', 'gwApiHelper', 'gwApiConfig', function ($q, $http, $timeout, $httpParamSerializerJQLike, $cacheFactory, $cookies, $location, gwApiHelper, gwApiConfig) {

        var me = this;

        var initialized = false;

        var $httpDefaultCache = $cacheFactory.get('$http');

        var devBaseUrl = 'https://apidev.growish.com/v1';
        var prodBaseUrl = 'https://api.growish.com/v1';

        var devSocketServerUrl = 'https://webpaymentsdev.growish.com';
        var prodSocketServerUrl = 'https://webpayments.growish.com';

        var session;

        var defaults = {
            env: 'developing',
            baseUrl: devBaseUrl,
            socketServerUrl: devSocketServerUrl,
            preserveUserSession: true,
            localStorageFile: 'gw-api-data',
            useCookies: false,
            language: 'it'
        };


        var apiConfig = {};

        var ApiStorageClass = function () {

            var cookieOptions = {
                path: '/',
                domain: gwApiHelper.isIp($location.host()) ? $location.host() : "." + gwApiHelper.removeSubdomain($location.host())
            };

            this.save = function (value) {
                if (!apiConfig.useCookies)
                    localStorage.setItem(apiConfig.localStorageFile, value);
                else {
                    var elObj = JSON.parse(value);
                    $cookies.put('api-id', elObj.id, cookieOptions);
                    $cookies.put('api-token', elObj.token, cookieOptions);
                    $cookies.put('api-user', window.btoa(value), cookieOptions);
                }
            };

            this.remove = function () {
                if (!apiConfig.useCookies)
                    localStorage.removeItem(apiConfig.localStorageFile);
                else {

                    $cookies.remove('api-id', cookieOptions);
                    $cookies.remove('api-token', cookieOptions);
                    $cookies.remove('api-user', cookieOptions);

                }
            };

            this.get = function () {
                if (!apiConfig.useCookies)
                    return localStorage.getItem(apiConfig.localStorageFile);
                else {

                    var userId = $cookies.get('api-id', cookieOptions);
                    var token = $cookies.get('api-token', cookieOptions);
                    var user = $cookies.get('api-user', cookieOptions);

                    if (typeof userId === 'undefined' || typeof token === 'undefined' || typeof user === 'undefined')
                        return null;

                    user = JSON.parse(window.atob(user));
                    user.token = token;
                    user.id = userId;

                    return user;
                }
            };

        };

        var apiStorage = new ApiStorageClass();

        this.getBaseUrl = function () {
            return apiConfig.baseUrl;
        };

        this.getFullUrl = function (methodName, args, urlParams) {
            var method = methods.find(methodName);
            return this.getBaseUrl() + method.getEndPoint(args, urlParams);
        };

        this.getAuthenticationHeaders = function () {
            return {
                'X-App-Key': apiConfig.appKey,
                'X-Auth-Token': session ? session.token : ""
            };
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

        methods.add('cashContribution', '/cash_contribution/');

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

        methods.add('weddingPremiumProducts', '/premium-products/');

        methods.add('premiumProductSold', '/premium-product-sold/{0}/');

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

        methods.add('cart.product', '/cart/{0}/product/{1}/');

        methods.add('buyPremiumProducts', '/buy-premium-products/{0}/');

        methods.add('cart.voucher', '/cart/{0}/voucher/');

        methods.add('product.comment', '/product/{0}/comment/');

        methods.add('list.quiz', '/list/{0}/quiz/');

        methods.add('list.editQuiz', '/list/{0}/quiz/{1}/');

        methods.add('list.quizAnswers', '/list/{0}/quiz-answers/');

        methods.add('quiz.newQuestion', '/quiz/{0}/question/');

        methods.add('quiz.question', '/quiz/{0}/question/{1}/');

        methods.add('quizRanking', '/quiz-ranking/{0}/');

        methods.add('quizQuestionPosition', '/quiz-question-position/{0}/');

        //legacy method, use userImageUpload instead
        methods.add('chatImageUpload', '/list/{0}/chat-image-upload/');

        methods.add('userImageUpload', '/wallet/{0}/user-image-upload/');

        methods.add('updateUserImageUpload', '/wallet/{0}/user-image-upload/{1}/');

        methods.add('sendMoneyBusiness', '/transfer-business/');

        methods.add('userBusinessCoupon', '/business-coupon/');

        methods.add('businessCoupon', '/business-coupon/{0}/');

        methods.add('buyBusinessCoupon', '/buy-business-coupon/');

        methods.add('newGenericList', '/generic-list/');

        methods.add('changePurchaseProduct', '/change-purchase-product/{0}/');

        methods.add('deleteListWallpaper', '/image/{0}/');

        methods.add('adminGreeting', '/admin-greeting/{0}/');

        methods.add('buyDirectPremiumProduct', '/buy-direct-premium-product/');

        methods.add('buyLnoPlan', '/buy-lno-plan/');

        methods.add('userAgencyProduct', '/user-agencyproduct/{0}/');

        methods.add('userAgencyProductImage', '/user-agencyproductimage/{0}/');

        methods.add('userAgencyProductImage.delete', '/user-agencyproductimage/{0}/{1}/');

        methods.add('userAgencyproductQuote', '/user-agencyproductquote/{0}/');

        methods.add('posContribution', '/pos-contribution/');

        methods.add('posContribution.reference', '/pos-contribution/{0}/');

        methods.add('merchantUserWallet', '/merchant-user-wallet/');

        methods.add('merchantActivateUserWallet', '/merchant-activate-user-wallet/');

        methods.add('merchantUserListWallet', '/merchant-user-listwallet/');

        methods.add('merchantUserGenericListWallet', '/merchant-user-genericlistwallet/');

        methods.add('pidAuth', '/pid-auth/');

        methods.add('merchantResendPin', '/merchant-resend-pin/{0}/');

        methods.add('merchantUser', '/merchant-user/');

        methods.add('merchantWallet', '/merchant-wallet/');

        methods.add('transferMerchant', '/transfer-merchant/');

        methods.add('saasMerchant', '/saas-merchant/');

        methods.add('userAgencyKycActivation', '/user-agency-kyc-activation/{0}/');

        methods.add('userAgencyKyc', '/user-agency-kyc-activation/');

        methods.add('acceptContract', '/accept-contract/{0}/');

        methods.add('weddingPremiumProduct', '/premium-products/{0}/');

        methods.add('newCardRegistration', '/card-registration/');

        methods.add('modifyCardRegistration', '/card-registration/{0}/');

        methods.add('getCards', '/card/');

        methods.add('getUserAllWallet', '/user-all-wallet/');

        methods.add('transferUserWallet', '/transfer-user-wallet/');

        methods.add('transferPayment', '/transfer-payment/');

        methods.add('cardPayment', '/card-payment/');

        methods.add('premiumProductContributor', '/premium-product-contributor/');


        var RequestClass = function (method, args) {

            var me = this;
            var fullResponse = false;
            var onlyLocalError = false;

            this.read = function (urlParams, cache) {
                return new ServerCallPromise(method, args, null, 'GET', urlParams, cache, fullResponse, onlyLocalError, null);
            };

            this.save = function (body, progressHandler) {
                return new ServerCallPromise(method, args, body, 'POST', null, null, fullResponse, onlyLocalError, progressHandler || null);
            };

            this.update = function (body) {
                return new ServerCallPromise(method, args, body, 'PUT', null, null, fullResponse, onlyLocalError, null);
            };

            this.delete = function () {
                return new ServerCallPromise(method, args, null, 'DELETE', null, null, fullResponse, onlyLocalError, null);
            };

            this.setFullResponse = function () {
                fullResponse = true;
                return me;
            };

            this.onlyLocalError = function () {
                onlyLocalError = true;
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

        var ServerCallPromise = function (_method, _args, _body, verb, _urlParams, cache, fullResponse, onlyLocalError, progressHandler) {
            var method = angular.copy(_method);
            var args = angular.copy(_args);

            var body;
            if (_body && _body.constructor.name === "File") {
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

            headers['Cache-control'] = 'no-store';
            headers['Cache-Control'] = 'no-cache';
            headers['Pragma'] = 'no-cache';
            headers['Expires'] = '0';

            if (apiConfig.language !== 'it')
                headers['X-Language'] = apiConfig.language;

            headers['Content-Type'] = 'application/x-www-form-urlencoded';
            var data = null;

            if (body && body.constructor.name === "File") {
                headers['Content-Type'] = undefined;

                data = new FormData();
                data.append('0', body);

            }
            else if (body && verb === 'POST') {
                headers['Content-Type'] = undefined;
                data = new FormData();
                for (var property in body) {
                    if (body.hasOwnProperty(property)) {
                        if (body[property] && _body[property] && _body[property].constructor.name === "File") {
                            data.append(property, _body[property]);
                        } else if (typeof body[property] !== 'undefined') {
                            data.append(property, body[property]);
                        }

                    }
                }

            }
            else if (body) {
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

            if (verb === 'GET' && cacheManager.inCache(httpOptions.url) === 'expired') {
                $httpDefaultCache.remove(httpOptions.url);
                debugMsg('Dropping cache for ' + httpOptions.url);
            }
            else if (verb === 'GET' && cacheManager.inCache(httpOptions.url) === 'cached') {
                httpOptions.cache = true;
                debugMsg('Cache found for ' + httpOptions.url);
            }
            else if (verb === 'GET' && cache) {
                cacheManager.add(httpOptions.url, cache);
                httpOptions.cache = true;
                debugMsg('Caching ' + httpOptions.url);
            }

            if (typeof progressHandler === 'function') {

                httpOptions.uploadEventHandlers = {
                    progress: progressHandler
                }
            }

            debugMsg(httpOptions);
            $http(httpOptions)
                .then(
                    function success(response) {

                        var payload;

                        if (!fullResponse)
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

                        if (err.status === 400) {

                            response.validationErrorsFull = err.data.message;

                            angular.forEach(err.data.message, function (errors, field) {
                                angular.forEach(errors, function (msg, error) {
                                    response.validationErrors[field] = msg;
                                });
                            });

                            if (typeof apiConfig.error400 === 'function' && !onlyLocalError) {
                                response.handled = true;
                                apiConfig.error400(response);
                            }

                            deferred.reject(response);
                        }
                        else if (err.status === 401 && typeof apiConfig.error401 === 'function' && !onlyLocalError) {
                            response.handled = true;
                            apiConfig.error401(err.data);
                            deferred.reject(response);
                        }
                        else if (err.status === 403 && typeof apiConfig.error403 === 'function' && !onlyLocalError) {
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
            apiStorage.remove();
        };

        this.language = function (lang) {
            apiConfig.language = lang;
        };

        this.updateSession = function (user) {
            session.firstName = user.firstName;
            session.lastName = user.lastName;
            session.birthday = user.birthday;
            session.taxCode = user.taxCode;

            apiStorage.save(angular.toJson(session));
        };

        this.setSession = function (user) {
            session = user;
            apiStorage.save(angular.toJson(user));
        };

        this.restoreSession = function (userId, token) {

            session = {
                id: userId,
                token: token
            };

            var deferred = $q.defer();

            me.request('user', session.id).read().then(
                function success(user) {
                    me.setSession({
                        token: token,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        birthday: user.birthday,
                        taxCode: user.taxCode,
                        imageUrl: user.imageUrl
                    });
                    deferred.resolve(user);
                },
                function error() {
                    me.dropSession();
                    deferred.reject();
                }
            );

            return deferred.promise;
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
                var _session = apiStorage.get();
                if (_session)
                    _session = angular.fromJson(_session);

                if (_session && _session.id) {
                    session = _session;
                    me.request('user', session.id).onlyLocalError().read().then(
                        function success() {
                            debugMsg('Session found in local storage and validated in API');
                            deferred.resolve(session);
                        },
                        function error() {
                            debugMsg('Session found in local storage but invalidated in API');
                            apiStorage.remove();
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

            if (typeof options.baseUrl === 'undefined' && typeof options.env !== 'undefined' && options.env === 'production') {
                options.baseUrl = prodBaseUrl;
                options.socketServerUrl = prodSocketServerUrl;
            }

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

        var socket;

        function connectToSocketApi() {
            var deferred = $q.defer();

            debugMsg("Connecting to socket server");
            socket = io(apiConfig.socketServerUrl, {
                'reconnection': false
            });

            socket.on('connect', function () {
                debugMsg("Connected to socket server");
                deferred.resolve();
            });

            socket.on('connect_error', function () {
                debugMsg("Error while connecting to socket server");
                deferred.reject({message: "Il server di pagamenti non è raggiungibile in questo momento, si prega di riprovare più tardi."});
            });

            return deferred.promise;
        }


        function processIoRequest(cmd, payload, deferred) {

            var messageId = "p" + String(Math.round(Math.random() * 10000)) + String(new Date().getTime());

            debugMsg("Setting listener", {messageId: messageId});

            socket.once(messageId, function (data) {

                debugMsg("Processing listener", {messageId: messageId});

                if (data.code === 200)
                    deferred.resolve(data);
                else
                    deferred.reject(data);
            });

            debugMsg("Emiting socket message", {cmd: cmd, messageId: messageId});
            socket.emit('message', {
                cmd: cmd,
                payload: payload,
                messageId: messageId,
                auth: me.getAuthenticationHeaders()
            });

        }

        this.ioRequest = function (cmd, payload) {

            var deferred = $q.defer();

            if (typeof io === 'undefined') {
                debugMsg('You need to load socket.io library');
                deferred.reject();
                return deferred.promise;
            }

            if (!socket || !socket.connected)
                connectToSocketApi().then(
                    function success() {
                        processIoRequest(cmd, payload, deferred);
                    },
                    function error(err) {
                        deferred.reject(err);
                    }
                );
            else
                processIoRequest(cmd, payload, deferred);

            return deferred.promise;

        };

        this.ioOnDisconnect = function (userFunc) {
            if (typeof userFunc !== 'function')
                return debugMsg('A handler function must be defined');

            if (typeof socket === 'undefined')
                return debugMsg('There is no socket connection');

            socket.on("disconnect", userFunc);
        };

        this.ioQuestionHandler = function (userFunc, timeoutFunc) {

            if (typeof userFunc !== 'function')
                return debugMsg('A handler function must be defined');

            if (typeof timeoutFunc !== 'function')
                return debugMsg('A timeout handler function must be defined');

            if (typeof socket === 'undefined')
                return debugMsg('There is no socket connection');


            socket.on('question', function (data) {

                socket.once('timeout-' + data.id, timeoutFunc);

                userFunc({
                    id: data.id,
                    text: data.text,
                    options: data.options
                }, {
                    send: function (value) {
                        debugMsg('Sending response to socker server', {id: data.id, value: value});
                        socket.off('timeout-' + data.id);
                        socket.emit(data.id, value);
                    },
                    cancel: function () {
                        debugMsg('Sending response to socker server (Cancel Action)', {id: data.id, value: null});
                        socket.off('timeout-' + data.id);
                        socket.emit(data.id, null);
                    }
                });

            })

        };

        this.ioNotificationHandler = function (userFunc) {

            if (typeof userFunc !== 'function')
                return debugMsg('A handler function must be defined');

            if (typeof socket === 'undefined')
                return debugMsg('There is no socket connection');


            socket.on('notification', function (data) {
                userFunc(data);
            })

        };

        this.getLastSession = function () {
            return apiStorage.get();
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
            $httpDefaultCache.removeAll();
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

                if (x >= 0) {
                    if (!_cachedUrl[x].expire || _cachedUrl[x].expire <= now) {
                        _cachedUrl.splice(x, 1);
                        return 'expired';
                    }
                    return 'cached';
                }
                return null;
            };

            this.add = function (url, time) {

                var now = new Date().getTime();
                var x = getCachedIndex(url);

                if (x >= 0) {
                    if (_cachedUrl[x].expire > now)
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

        if(gwApiConfig.get())
            this.initialize(gwApiConfig.get());

    }]);
angular.module('gwApiClient').service('gwApiHelper', function () {

    var firstTLDs  = "ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|be|bf|bg|bh|bi|bj|bm|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|cl|cm|cn|co|cr|cu|cv|cw|cx|cz|de|dj|dk|dm|do|dz|ec|ee|eg|es|et|eu|fi|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|im|in|io|iq|ir|is|it|je|jo|jp|kg|ki|km|kn|kp|kr|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|na|nc|ne|nf|ng|nl|no|nr|nu|nz|om|pa|pe|pf|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|yt".split('|');
    var secondTLDs = "com|edu|gov|net|mil|org|nom|sch|caa|res|off|gob|int|tur|ip6|uri|urn|asn|act|nsw|qld|tas|vic|pro|biz|adm|adv|agr|arq|art|ato|bio|bmd|cim|cng|cnt|ecn|eco|emp|eng|esp|etc|eti|far|fnd|fot|fst|g12|ggf|imb|ind|inf|jor|jus|leg|lel|mat|med|mus|not|ntr|odo|ppg|psc|psi|qsl|rec|slg|srv|teo|tmp|trd|vet|zlg|web|ltd|sld|pol|fin|k12|lib|pri|aip|fie|eun|sci|prd|cci|pvt|mod|idv|rel|sex|gen|nic|abr|bas|cal|cam|emr|fvg|laz|lig|lom|mar|mol|pmn|pug|sar|sic|taa|tos|umb|vao|vda|ven|mie|北海道|和歌山|神奈川|鹿児島|ass|rep|tra|per|ngo|soc|grp|plc|its|air|and|bus|can|ddr|jfk|mad|nrw|nyc|ski|spy|tcm|ulm|usa|war|fhs|vgs|dep|eid|fet|fla|flå|gol|hof|hol|sel|vik|cri|iwi|ing|abo|fam|gok|gon|gop|gos|aid|atm|gsm|sos|elk|waw|est|aca|bar|cpa|jur|law|sec|plo|www|bir|cbg|jar|khv|msk|nov|nsk|ptz|rnd|spb|stv|tom|tsk|udm|vrn|cmw|kms|nkz|snz|pub|fhv|red|ens|nat|rns|rnu|bbs|tel|bel|kep|nhs|dni|fed|isa|nsn|gub|e12|tec|орг|обр|упр|alt|nis|jpn|mex|ath|iki|nid|gda|inc".split('|');

    this.isIp = function (value) {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
    };

    this.removeSubdomain = function (s) {
        s = s.replace(/^www\./, '');

        var parts = s.split('.');

        while (parts.length > 3) {
            parts.shift();
        }

        if (parts.length === 3 && ((parts[1].length > 2 && parts[2].length > 2) || (secondTLDs.indexOf(parts[1]) === -1) && firstTLDs.indexOf(parts[2]) === -1)) {
            parts.shift();
        }

        return parts.join('.');
    };

});
angular.module('gwApiClient').provider('gwApiConfig', function () {

    var _options = null;

    return {
        set: function (opts) {
            _options = opts;
        },
        $get: function () {
            return {
                get: function () {
                    return _options;
                }
            }
        },

    }


});