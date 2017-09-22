app.controller('demoController', function ($scope, gwApi) {

    $scope.loader = false;
    $scope.session = {};

    $scope.loginForm = {
        email: "",
        password: ""
    };

    $scope.listWallet = "";

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

    $scope.getUser = function () {

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
                return gwApi.request('user', session.id).read();
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
            function success(userListWallts) {
                $scope.userListWallts = userListWallts;
                $scope.loader = false;
            },
            function error() {
                $scope.loader = false;
            }
        );

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


    $scope.getFile = function (i) {
        $scope.loader = true;
        console.log(i);
        gwApi.request('setImageUser', $scope.session.id).save(i).then(
            function success() {
                $scope.session.imageUrl += "?rand="+ moment().format('X');
                $scope.loader = false;
            },
            function error() {
                console.log('errore')
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
    }

});