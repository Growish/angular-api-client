app.controller('demoController', function ($scope, gwApi) {

    //for console testing
    window.gwApi = gwApi;

    $scope.loader = false;
    $scope.session = {};

    $scope.loginForm = {
        email: "",
        password: ""
    };
    $scope.listWallet = "";
    $scope.business = "";
    $scope.lostPasswordForm = {
        email: ''
    };
    $scope.beneficiary = {
        // bankAccountIBAN: "",
        // bankAccountOwnerAddress: '',
        // bankAccountOwnerName: ''
    };
    $scope.withdrawalForm = {};
    $scope.pinRequired = false;

    $scope.kycAuthForm = {
        occupation: ""
    };

    $scope.requiredFile = {
        name: "",
        image: ""
    };
    $scope.optionalFile = {
        name: "",
        image: ""
    };

    $scope.productForm = {
        walletId: "",
        name: "",
        description: "",
        goalAmount: "",
        url: "",
        type: "100",
        category: "growish",
        id: ""
    };

    $scope.product = {
        name: "",
        image: ""
    };


    gwApi.session().then(
        function (user) {
            $scope.session = user;
        },
        function () {
            $scope.session = {};
        }
    );

    $scope.loginUser = function () {
        $scope.loginForm.errors = {};
        $scope.loader = true;
        gwApi.authenticate($scope.loginForm.email, $scope.loginForm.password).then(
            function success(session) {
                $scope.loader = false;

                //After a successful login you save the session in the API
                gwApi.setSession(session);

                $scope.session = session;
            },
            function error(err) {
                $scope.loader = false;

                //Since login usually requires a form to input values
                //It is to be expected to have validation errors
                //You can check for 400 errors and display them in
                //the view.
                if (err.code === 400)
                    $scope.loginForm.errors = err.validationErrors;
            }
        );
    };

    $scope.logoutUser = function () {
        $scope.loader = true;
        gwApi.logout().then(
            function success() {
                $scope.loader = false;
                $scope.session = {};
                //gwApi.logout cleans the session from cache and from localStorage
            },
            function error() {
                $scope.loader = false;
            }
        );
    };

    $scope.clearCache = function () {
        gwApi.clearCache();
    };

    $scope.getUser = function (cache) {

        $scope.loader = true;

        //gwApi.session can be call as a promise or as
        //atomic function by passing true as argument
        //var session = gwApi.session(true);
        //This will check if there is a session in cache
        //or localStorage, but it will not trie to check if
        //the token is still valid in backend.

        //Session called as promise (it checks token validity every time)
        gwApi.session().then(
            function success(session) {
                return gwApi.request('user', session.id).read({}, (cache) ? 20 : null); //cache for 20 seconds if 'cache' is passed
            }
        ).then(
            function success(user) {
                $scope.user = user;
                $scope.loader = false;
            }
        ).catch(function () {
            $scope.loader = false;
        })

    };

    $scope.getListWallets = function () {

        $scope.loader = true;

        //Session called as atomic function (It does not check token validity)
        var session = gwApi.session(true);

        gwApi.request('listWallets', session.id).read().then(
            function success(userListWallets) {
                console.log(userListWallets);
                $scope.userListWallts = userListWallets;
                $scope.loader = false;
            },
            function error() {
                $scope.loader = false;
            }
        );

    };

    $scope.getWallets = function () {

        $scope.loader = true;

        //Session called as atomic function (It does not check token validity)
        var session = gwApi.session(true);

        gwApi.request('wallets', session.id).read().then(
            function success(wallets) {
                $scope.wallets = wallets;
                $scope.loader = false;
            },
            function error() {
                $scope.loader = false;
            }
        );

    };

    //THE LAST PARAMETER IN READ; "10", INDICATES
    //THE API TO CACHE THE RESPONSE FOR 10 SECONDS
    //TO FLUSH THE API CASH IN ANY MOMENT USE gwApi.flushCache()
    $scope.getBusiness = function () {
        $scope.loader = true;
        gwApi.request('business').setFullResponse().read({lat: 45.0606543, lon: 7.6855409, radius: 20000, network: "NozzePay", filterByName: "", page: 1}, 10).then(
            function success(response) {
                $scope.businessPagination = response.pagination;
                $scope.business = response.data;
                $scope.loader = false;
            },
            function error() {
                $scope.loader = false;
            }
        )
    };

    $scope.getListWalletStatement = function () {

        $scope.loader = true;

        var listWalletId = $scope.listWallet;

        gwApi.request('listWallet.statement', listWalletId).read().then(
            function success(statement) {
                $scope.statement = statement;
                $scope.loader = false;
            },
            function error() {
                $scope.loader = false;
            }
        );

    };

    function progressHandler(e) {
        if (e.lengthComputable) {
            $scope.progressBar = (e.loaded / e.total) * 100;
            $scope.progressCounter = $scope.progressBar;
        }
    }

    $scope.getFile = function (i) {

        $scope.loader = true;

        gwApi.request('setImageUser', $scope.session.id).save(i, progressHandler).then(
            function success() {
                $scope.session.imageUrl += "?rand="+ moment().format('X');
                $scope.loader = false;
            },
            function error() {
                console.log('errore');
                $scope.loader = false;
            }
        );

    };

    $scope.getNotifications = function (project) {
        $scope.loader = true;
        gwApi.request('user.notifications', $scope.session.id).read({category: project}).then(
            function success(notifications) {
                $scope.loader = false;
                console.log(notifications);
            },
            function error() {
                $scope.loader = false;
            }
        );
    };


    $scope.lostPassword = function () {
        $scope.loader = true;
        gwApi.request('restorePassword').save({
            email: $scope.lostPasswordForm.email
        }).then(
            function success() {
                $scope.loader = false;
                alert('Success!');
                $scope.lostPasswordForm.email = "";
            },
            function error() {
                $scope.loader = false;
            }
        )
    };


    $scope.newBeneficiary = function () {
        $scope.loader = true;
        gwApi.request('beneficiary').save({
            bankAccountIBAN: $scope.beneficiary.bankAccountIBAN,
            bankAccountOwnerAddress: $scope.beneficiary.bankAccountOwnerAddress,
            bankAccountOwnerName: $scope.beneficiary.bankAccountOwnerName

        }).then(
            function success() {
                $scope.loader = false;
                alert('Success!');
                $scope.beneficiary = {
                    bankAccountIBAN: '',
                    bankAccountOwnerAddress: '',
                    bankAccountOwnerName: ''
                }
            },
            function error() {

            }
        )
    };

    $scope.getBeneficiary = function () {
        $scope.loader = true;
        gwApi.request('beneficiary').read().then(
            function success(response) {
                $scope.loader = false;
                $scope.beneficiaryData = response;
            },
            function error() {

            }
        );
    };

    $scope.cashOut = function () {
        $scope.loader = true;
        gwApi.request('withdrawal').save({
            walletId: $scope.withdrawalForm.walletId,
            beneficiaryId: $scope.withdrawalForm.beneficiaryId,
            amount: $scope.withdrawalForm.amount * 100,
            password: $scope.withdrawalForm.password,
            pin: $scope.withdrawalForm.pin
        }).then(
            function success() {
                $scope.loader = false;
                $scope.withdrawalForm = {
                    walletId:'',
                    beneficiaryId:'',
                    amount:'',
                    password:'',
                    pin:''
                };
                $scope.pinRequired = false;
                alert('Cash out complete!');
            },
            function error(err) {
                $scope.loader = false;
                if(err.code === 417){
                    alert('This method is asking for a pin, the api send a pin number to the cellphone registered to the list, if you are testing outside of Italy please contact a Growish developer');
                    $scope.pinRequired = true;
                };

            }
        )
    };

    $scope.kycUserAuth = function() {
        $scope.loader = true;
        $scope.formError = {};
        gwApi.request('userKycAuthentication').save({
            occupation: $scope.kycAuthForm.occupation,
            requiredFile: $scope.requiredFile.image,
            optionalFile: $scope.optionalFile.image
        }).then(
            function success() {
                $scope.loader = false;
                alert('Success!');
                $scope.kycAuthForm = {
                    occupation: ""
                };

                $scope.requiredFile = {
                    name: "",
                    image: ""
                };
                $scope.optionalFile = {
                    name: "",
                    image: ""
                };
            },
            function error(err) {
                if(err.code === 400)
                    $scope.formError = err.validationErrors;
                $scope.loader = false;
            }
        )
    };

    $scope.addNewProduct = function() {
        $scope.loader = true;
        $scope.formError = {};
        gwApi.request('addNewProduct', $scope.productForm.walletId).save({
            name:  $scope.productForm.name,
            description:  $scope.productForm.description,
            goalAmount: $scope.productForm.goalAmount * 100,
            url: $scope.productForm.url,
            type: $scope.productForm.type,
            category: $scope.productForm.category,
            id: $scope.productForm.id,
            file: $scope.product.image
        }).then(
            function success() {
                $scope.loader = false;
                alert('Success!');
                $scope.productForm = {
                    walletId: "",
                    name: "",
                    description: "",
                    goalAmount: "",
                    url: "",
                    type: "100",
                    category: "growish",
                    id: ""
                };

                $scope.product = {
                    name: "",
                    image: ""
                };
            },
            function error(err) {
                if(err.code === 400)
                    $scope.formError = err.validationErrors;
                $scope.loader = false;
            }
        )
    };


});